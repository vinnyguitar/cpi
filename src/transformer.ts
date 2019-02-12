import * as ts from 'typescript';

const supportMethod = ['get', 'post', 'put', 'all', 'delete'];
const supportParam = ['query', 'body', 'param'];

export const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {

    const transformMethod = (classNode: ts.Node, prefix: string) => {
        const visitor: ts.Visitor = (node) => {
            if (ts.isDecorator(node)) {// 删除controller装饰器
                return null;
            }
            if (ts.isMethodDeclaration(node)) {
                const [url, method] = resolveUrlAndMethod(node.decorators);
                if (url && method) {
                    // 获取参数结构
                    return ts.visitEachChild(node, (methodChildNode) => {
                        if (ts.isParameter(methodChildNode)) {
                            // console.log(methodChildNode.getChildAt(0).getText());
                            return null;
                        }
                        if (ts.isBlock(methodChildNode)) {
                            // console.log(methodChildNode.statements);
                            // ts.createObjectLiteral();
                            const decrementedArg = ts.createLiteral(prefix + url);
                            //
                            const aaa = ts.createPropertyAssignment('aaa', ts.createLiteral('/'));
                            return ts.createBlock([
                                ts.createStatement(ts.createCall(ts.createIdentifier('abc'),
                                    undefined, [decrementedArg,
                                        ts.createLiteral(method),
                                        ts.createObjectLiteral([aaa]),
                                    ]))]);
                            // ts.createSourceFile
                            // console.log(ts.createUnparsedSourceFile('{console.log()}').getText());
                            // return ts.createBlock([ts.createCall([], undefined, undefined)]);
                            // return ts.createUnparsedSourceFile('{console.log()}');
                            // ts.updateBlock(ts);
                            // return ts.createBlock(ts.);
                        }
                        return methodChildNode;
                    }, context);
                }
                // resolveParam(node);
                // // 解析url,method[x]
                // // 获取参数定义
                // // 修改参数
                // // 修改方法体
                // // ts.updateFunctionDeclaration();
                // return null;
            }
            return node;
        };

        return ts.visitEachChild(classNode, visitor, context);
    };

    const transformController = (sourceFile: ts.Node) => {
        const visitor: ts.Visitor = (node) => {
            if (ts.isClassDeclaration(node)) {
                const prefix = getControllerPrefix(node.decorators);
                if (prefix !== undefined) {
                    return transformMethod(node, prefix);
                }
            }
            return node;
        };

        return ts.visitEachChild(sourceFile, visitor, context);
    };

    return (node) => ts.visitNode(node, (sourceFile) => transformController(sourceFile));
};

/**
 * 识别@Controller('')装饰器
 * @param decorators
 */
function getControllerPrefix(decorators: ts.NodeArray<ts.Decorator>): string | undefined {
    const arr = decorators.filter((dec) => dec.expression.getChildAt(0).getText().toLowerCase() === 'controller');
    if (arr.length) {
        return arr[0].expression.getChildAt(2).getText().replace(/['"]/g, '') || '';
    }
}

/**
 * 识别@Get('url')中的url,method
 * @param decorators
 */
function resolveUrlAndMethod(decorators: ts.NodeArray<ts.Decorator>): [string, string] {
    const arr = decorators
        .filter((dec) => supportMethod.indexOf(dec.expression.getChildAt(0).getText().toLowerCase()) > -1);
    if (arr.length) {
        const first = arr[0];
        return [first.expression.getChildAt(2).getText(), first.expression.getChildAt(0).getText()];
    }
    return [null, null];
}

function resolveParam(node: ts.Node) {
    for (let i = 0; i < node.getChildCount(); i++) {
        const child = node.getChildAt(i);
        if (child.kind === ts.SyntaxKind.OpenParenToken
            && node.getChildAt(i + 2).kind === ts.SyntaxKind.CloseParenToken) {
            const param = node.getChildAt(i + 1);
            for (let j = 0; j < param.getChildCount(); j++) {
                // console.log(param.getChildAt(j).getText(), param.getChildCount());
            }
        }
    }
}
