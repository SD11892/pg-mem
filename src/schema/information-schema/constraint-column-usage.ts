import { _ITable, _ISelection, IValue, _IIndex, _IDb, IndexKey, setId, _ISchema } from '../../interfaces-private';
import { Schema } from '../../interfaces';
import { Types } from '../../datatypes';
import { ReadOnlyTable } from '../readonly-table';

export class ConstraintColumnUsage extends ReadOnlyTable implements _ITable {


    _schema: Schema = {
        name: 'constraint_column_usage',
        fields: [
            { name: 'constraint_catalog', type: Types.text() }
            , { name: 'constraint_schema', type: Types.text() }
            , { name: 'constraint_name', type: Types.text() }

            , { name: 'table_catalog', type: Types.text() }
            , { name: 'table_schema', type: Types.text() }
            , { name: 'table_name', type: Types.text() }

            , { name: 'column_name', type: Types.text() }
        ]
    };


    entropy(): number {
        return 0;
    }

    *enumerate() {
    }


    hasItem(value: any): boolean {
        return false;
    }

}