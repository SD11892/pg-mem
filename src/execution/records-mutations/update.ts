import { _ITable, _Transaction, _Explainer, _ISchema, asTable, _ISelection, _IIndex, _IStatement } from '../../interfaces-private';
import { UpdateStatement } from 'pgsql-ast-parser';
import { MutationDataSourceBase, Setter, createSetter } from './mutation-base';
import { buildCtx } from '../../parser/context';
import { buildSelect } from '../select';
import { Selection } from '../../transforms/selection';
import { JoinSelection } from '../../transforms/join';

export class Update extends MutationDataSourceBase<any> {

    private setter: Setter;

    constructor(ast: UpdateStatement) {
        const { schema } = buildCtx();
        const into = asTable(schema.getObject(ast.table));
        let mutatedSel: _ISelection;
        if (ast.from) {

            //  => UPDATE-FROM-SELECT

            // build a join that selects the full record to update,
            // based on the data from the original selection
            mutatedSel = buildSelect({
                type: 'select',
                // join from:
                from: [
                    ast.from,
                    {
                        type: 'table',
                        name: ast.table,
                        join: {
                            type: 'INNER JOIN',
                            on: ast.where,
                        }
                    }],
                // // select the whole updated record
                columns: [{
                    expr: {
                        type: 'ref',
                        table: ast.table,
                        name: '*',
                    }
                }]
            });

            // this should have built a selection on a join statement
            if (!(mutatedSel instanceof Selection)) {
                throw new Error('Invalid select-from statement');
            }
            mutatedSel = mutatedSel.base;
            if (!(mutatedSel instanceof JoinSelection)) {
                // should not happen
                throw new Error('Invalid select-from statement');
            }
            // use hack to get the full joined source in the selection
            mutatedSel.returnJoinedSource = true;
        } else {

            //  => REGULAR UPDATE
            mutatedSel = into
                .selection
                .filter(ast.where);
        }


        super(into, mutatedSel, ast);

        this.setter = createSetter(this.table, this.mutatedSel, ast.sets);

    }

    protected performMutation(t: _Transaction): any[] {
        // perform update
        const rows: any[] = [];
        for (const i of this.mutatedSel.enumerate(t)) {
            this.setter(t, i, i);
            rows.push(this.table.update(t, i));
        }
        return rows;
    }
}
