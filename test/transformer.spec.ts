import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { transformer } from '../src/transformer';
const printer = ts.createPrinter();

describe('test transformer', () => {
    test('user', () => {
        const code = fs.readFileSync(path.join(__dirname, 'feature/user/user.controller.ts'), 'utf-8');
        const source = ts.createSourceFile('user.controller.ts', code, ts.ScriptTarget.ES2016, true);
        const result = ts.transform(source, [transformer]);

        const transformedSourceFile = result.transformed[0];

        const resultCode = printer.printFile(transformedSourceFile);
        expect(resultCode).toBe(fs.readFileSync(path.join(__dirname, 'expect/user.txt'), 'utf-8'));
    });
});
