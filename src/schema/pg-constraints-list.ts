import { _ITable, _ISelection, IValue, _IIndex, _IDb, IndexKey, setId, _IQuery, _Transaction } from '../interfaces-private';
import {  Schema } from '../interfaces';
import { Types, makeArray } from '../datatypes';
import { TableIndex } from './table-index';
import { ReadOnlyTable } from './readonly-table';

const IS_SCHEMA = Symbol('_is_pgconstraint');
export class PgConstraintTable extends ReadOnlyTable implements _ITable {

    get ownSymbol() {
        return IS_SCHEMA;
    }

    _schema: Schema = {
        name: 'columns',
        fields: [
            { id: 'oid', type: Types.int } // hidden oid column
            , { id: 'conname', type: Types.text() } // <== 'name' type
            , { id: 'connamespace', type: Types.int } // <== 'oid' type
            , { id: 'contype', type: Types.text(1) } // <== 'char(1)' type
            , { id: 'condeferrable', type: Types.bool }
            , { id: 'condeferred', type: Types.bool }
            , { id: 'convalidated', type: Types.bool }
            , { id: 'conrelid', type: Types.int } // <== oid
            , { id: 'contypid', type: Types.int } // <== oid
            , { id: 'conindid', type: Types.int } // <== oid
            , { id: 'conparentid', type: Types.int } // <== oid
            , { id: 'confrelid', type: Types.int } // <== oid
            , { id: 'confupdtype', type: Types.text(1) } // <== 'char(1)' type
            , { id: 'confdeltype', type: Types.text(1) } // <== 'char(1)' type
            , { id: 'confmatchtype', type: Types.text(1) } // <== 'char(1)' type
            , { id: 'conislocal', type: Types.bool }
            , { id: 'coninhcount', type: Types.int }
            , { id: 'connoinherit', type: Types.bool }
            , { id: 'conkey', type: makeArray(Types.int) }
            , { id: 'confkey', type: makeArray(Types.int) }
            , { id: 'conpfeqop', type: makeArray(Types.int) } // <== oid[]
            , { id: 'conppeqop', type: makeArray(Types.int) } // <== oid[]
            , { id: 'conffeqop', type: makeArray(Types.int) } // <== oid[]
            , { id: 'conexclop', type: makeArray(Types.int) } // <== oid[]
            , { id: 'conbin', type: Types.text() } // <== weird type
            , { id: 'consrc', type: Types.text() }
        ]
    };


    entropy(t: _Transaction): number {
        return this.schema.tablesCount(t) * 10 * 3;
    }

    *enumerate(t: _Transaction) {
        for (const it of this.schema.listTables(t)) {
            yield* this.itemsByTable(it, t);
        }
    }

    make(table: string, i: number, t: IValue<any>): any {
        if (!t) {
            return null;
        }
        let ret = {};
        for (const { id } of this._schema.fields) {
            ret[id] = null;
        }

        ret = {
            ...ret,
            // table_catalog: 'pgmem',

            [IS_SCHEMA]: true,
        };
        setId(ret, '/pg_constraint/' + table + '/' + i);
        return ret;
    }

    hasItem(value: any): boolean {
        return !!value?.[IS_SCHEMA];
    }

    getIndex(forValue: IValue<any>): _IIndex<any> {
        if (forValue.id === 'table_name') {
            return new TableIndex(this, forValue);
        }
        return null;
    }

    *itemsByTable(table: string | _ITable, t: _Transaction) {
        const got = typeof table === 'string'
            ? this.schema.getTable(table, true)
            : table;
        if (got) {
            let i = 0;
            for (const f of got.selection.columns) {
                yield this.make(got.name, ++i, f);
            }
        }
    }

}
