import 'mocha';
import 'chai';
import { newDb } from '../db';
import { expect, assert } from 'chai';
import { CompiledFunction, DataType, IMemoryDb } from '../interfaces';
import { preventSeqScan } from './test-utils';

describe('Custom functions', () => {

    let db: IMemoryDb;
    let many: (str: string) => any[];
    let one: (str: string) => any;
    let none: (str: string) => void;
    function all(table = 'data') {
        return many(`select * from ${table}`);
    }
    beforeEach(() => {
        db = newDb();
        many = db.public.many.bind(db.public);
        one = db.public.one.bind(db.public);
        none = db.public.none.bind(db.public);
    });


    it('can declare a custom implementation of plpgsql language', () => {
        let executed = false;
        db.registerLanguage('plpgsql', ({ code, args, returns }) => {
            expect(code).to.equal('whatever');
            return () => {
                executed = true;
            };
        });
        none(` do $$whatever$$;`);
        assert.isTrue(executed, 'Cusotm language was not executed');
    });

    it('can declare a custom language', () => {
        db.registerLanguage('mylanguage', ({ code, args, returns }) => {
            expect(code).to.equal('whatever');
            return arg => {
                expect(arg).to.equal('some arg');
                return 42;
            };
        });

        none(`CREATE FUNCTION test_fn(arg text) RETURNS int
                AS $$whatever$$
                LANGUAGE mylanguage;`)

        expect(one(`SELECT test_fn('some arg');`)).to.deep.equal({ test_fn: 42 });
    });

    it('can use sql language as single value', () => {
        none(`CREATE FUNCTION test_fn(arg text) RETURNS int
                AS $$ select 42 $$
                LANGUAGE SQL;`)


        expect(one(`SELECT test_fn('some arg');`)).to.deep.equal({ test_fn: 42 });
    });


    it('can override sql language', () => {
        db.registerLanguage('sql', ({ code, args, returns }) => {
            expect(code).to.equal('whatever');
            return arg => {
                expect(arg).to.equal('some arg');
                return 42;
            };
        });

        none(`CREATE FUNCTION test_fn(arg text) RETURNS int
                AS $$whatever$$
                LANGUAGE SQL;`)

        expect(one(`SELECT test_fn('some arg');`)).to.deep.equal({ test_fn: 42 });
    });


    it('can use sql language as table', () => {
        none(`CREATE FUNCTION test_fn() RETURNS  table foo(val text) stable
                AS $$ select * from (values('a') ) as foo(val) $$
                LANGUAGE SQL;`)


        expect(one(`SELECT * from test_fn();`)).to.deep.equal({ val: 'a' });
    });

    it('can use arguments in table function', () => {
        none(`CREATE FUNCTION test_fn(arg text) RETURNS  table (val text) stable
                AS $$ select * from (values('hello ' || $1) , ('bye ' || $1) ) as foo(val) $$
                LANGUAGE SQL;`)


        expect(one(`SELECT * from test_fn('world') where val like 'hello%';`)).to.deep.equal({ val: 'hello world' });
    });



    it('can use table function of custom languages', () => {
        none(`CREATE FUNCTION test_fn(arg text) RETURNS  table foo(val text) stable
                AS $$ whatever $$
                LANGUAGE custom;`)

        db.registerLanguage('plpgsql', ({ code, args, returns }) => {
            expect(code).to.equal('whatever');
            return arg => [{ val: 'bye ' + arg }, { val: 'hello ' + arg }];
        });

        expect(one(`SELECT * from test_fn('world') WHERE val like 'hello%';`)).to.deep.equal({ val: 'hello world' });
    });
});
