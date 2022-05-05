import { _IStatementExecutor, _Transaction, StatementResult, GLOBAL_VARS, QueryError } from '../interfaces-private.ts';
import { SetGlobalStatement, SetTimezone } from 'https://deno.land/x/pgsql_ast_parser@10.0.5/mod.ts';
import { ignore } from '../utils.ts';
import { ExecHelper } from './exec-utils.ts';

export class SetExecutor extends ExecHelper implements _IStatementExecutor {

    constructor(private p: SetGlobalStatement | SetTimezone) {
        super(p);
        // todo handle set statements timezone ?
        // They are just ignored as of today (in order to handle pg_dump exports)
        ignore(p);
    }

    execute(t: _Transaction): StatementResult {
        const p = this.p;
        if (p.type === 'set' && p.set.type === 'value') {
            t.set(GLOBAL_VARS, t.getMap(GLOBAL_VARS)
                .set(p.variable.name, p.set.value));
        }
        return this.noData(t, 'SET');
    }
}
