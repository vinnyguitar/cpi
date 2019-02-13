import * as assert from 'assert';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as ts from 'typescript';
import { transformer } from './transformer';

const configJson = fs.readFileSync('cpiconfig.json', 'utf-8');
assert(configJson, 'cpiconfig.json must have!');
const config = JSON.parse(configJson);
assert(config.rootDir, 'cpiconfig.rootDir must have!');
assert(config.outDir, 'cpiconfig.outDit must have!');

const compilerOptions = {
    module: ts.ModuleKind.CommonJS,
    declaration: true,
    noImplicitAny: false,
    noLib: false,
    allowSyntheticDefaultImports: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    target: ts.ScriptTarget.ES2015,
    outDir: config.outDir,
    rootDir: config.rootDir,
};

const files = glob.sync('**/*.controller.ts', { cwd: config.rootDir })
    .map((f: string) => path.join(config.rootDir, f));

const compilerHost = ts.createCompilerHost(compilerOptions);
const program = ts.createProgram(files, compilerOptions, compilerHost);

program.emit(undefined, undefined, undefined, undefined, {
    before: [
        transformer,
    ],
});
const pkg = {
    name: config.name,
    version: config.version,
    description: config.description,
};
fs.writeFileSync(path.join(config.outDir, 'package.json'), JSON.stringify(pkg, undefined, '  '));
