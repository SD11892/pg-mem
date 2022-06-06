import { AggregationComputer, AggregationGroupComputer, IValue, nil, QueryError, _ISelection, _IType, _Transaction } from '../../interfaces-private';
import { ExprCall } from 'pgsql-ast-parser';
import { buildValue } from '../../parser/expression-builder';
import { Types } from '../../datatypes';
import { nullIsh } from '../../utils';
import { withSelection } from '../../parser/context';

class SumExpr implements AggregationComputer<number> {

    constructor(private exp: IValue) {
    }

    get type(): _IType<any> {
        return Types.bigint;
    }

    createGroup(t: _Transaction): AggregationGroupComputer<number> {
        let val: number | nil = null;
        return {
            feedItem: (item) => {
                const value = this.exp.get(item, t);
                if (!nullIsh(value)) {
                    val = nullIsh(val) ? value : val + value;
                }
            },
            finish: () => val,
        }
    }
}

export function buildSum(this: void, base: _ISelection, call: ExprCall) {
    return withSelection(base, () => {
        const args = call.args;
        if (args.length !== 1) {
            throw new QueryError('SUM expects one argument, given ' + args.length);
        }

        const what = buildValue(args[0]);
        return new SumExpr(what);

    });
}
