import 'mocha';
import { assert, expect } from 'chai';
import { newDb } from '../db';
import { IMemoryDb } from '../interfaces';

describe('Sequences', () => {

    let db: IMemoryDb;
    let many: (str: string) => any[];
    let none: (str: string) => void;
    function all(table = 'data') {
        return many(`select * from ${table}`);
    }
    beforeEach(() => {
        db = newDb();
        many = db.public.many.bind(db.public);
        none = db.public.none.bind(db.public);
    });


    it('can query next value non qualified default', () => {
        const res = many(`create sequence test;
                    select nextval('test')`);
        expect(res).to.deep.equal([{
            nextval: 1
        }])
    });

    it('can query next value non qualified inc', () => {
        const res = many(`create sequence test increment 5;
                            select nextval('test');`);
        expect(res).to.deep.equal([{
            nextval: 1
        }])
    });

    it('can query next value non qualified start', () => {
        const res = many(`create sequence test start 5 increment 2;
                            select nextval('test');`);
        expect(res).to.deep.equal([{
            nextval: 5
        }])
    });


    it('handles multiple increments', () => {
        let res = many(`create sequence test start 5 increment 2;
                        select nextval('test');
                        select nextval('test');`);
        expect(res).to.deep.equal([{
            nextval: 7
        }]);
        res = many(`select nextval('test');`);
        expect(res).to.deep.equal([{
            nextval: 9
        }])
    });


    it('can query next value qualified', () => {
        const res = many(`create sequence test;
                    select nextval('public."test"')`);
        expect(res).to.deep.equal([{
            nextval: 1
        }])
    });


    it('can query set value', () => {
        const res = many(`create sequence test;
                    select setval('test', 41);
                    select nextval('test');`);
        expect(res).to.deep.equal([{
            nextval: 42
        }])
    });

    it('can query current value', () => {
        const res = many(`create sequence test;
                    select setval('test', 42);
                    select CURRval('test');`);
        expect(res).to.deep.equal([{
            currval: 42
        }])
    });

    it('fails to get currval without initialization', () => {
        many(`create sequence test start 5 increment 2;`);

        assert.throws(() => none(`select currval('test');`), /currval of sequence "test" is not yet defined in this session/);
    });



    it('can define custom sequences', () => {
        none(`CREATE SEQUENCE if not exists public.test START WITH 40 INCREMENT BY 2 NO MINVALUE NO MAXVALUE CACHE 1 as bigint cycle`);

        const res = many(`select nextval('test');`);
        expect(res).to.deep.equal([{
            nextval: 40
        }])
    });


    it('cannot reach its maximum', () => {
        expect(many(`create sequence test maxvalue 3;
                select nextval('test');
                select nextval('test');
                select nextval('test');`))
            .to.deep.equal([{ nextval: 3 }]);
        assert.throws(() => none(`select nextval('test');`), /reached maximum value of sequence "test"/)
    })

});
