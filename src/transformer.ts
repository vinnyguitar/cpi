import * as ts from 'typescript';

const supportMethod = ['get', 'post', 'put', 'all', 'delete', 'patch'];
const ajaxName = 'window._cpi_ajax';

export const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {

    let hasController = false;

    const usedIdentifierNames = new Set<string>();

    const transformMethod = (node: ts.Node, prefix: string) => {
        if (ts.isMethodDeclaration(node)) {
            const [url, method] = resolveUrlAndMethod(node.decorators);
            if (method) {
                const apiArr = [];
                if (prefix !== '') {
                    apiArr.push(prefix);
                }
                if (url !== '') {
                    apiArr.push(url);
                }
                const apiArg = ts.createLiteral(apiArr.join('/').replace(/\/{2, n}/, '/'));
                const methodArg = ts.createLiteral(method);
                const queryArgProperties = [];
                const bodyArgProperties = [];
                const paramArgProperties = [];
                // 获取参数结构
                return ts.visitEachChild(node, (cnode) => {
                    if (ts.isParameter(cnode)) {
                        const param = resolveSupportedParam(cnode);
                        if (!param) { // 去掉非http参数
                            return null;
                        }
                        if (param.paramType) {
                            usedIdentifierNames.add(param.paramType);
                        }
                        let assignment;
                        if (param.key) {
                            assignment = ts.createPropertyAssignment(param.key, ts.createIdentifier(param.paramName));
                        } else {
                            assignment = ts.createSpreadAssignment(ts.createIdentifier(param.paramName));
                        }
                        switch (param.decoratorName) {
                            case 'Query':
                                queryArgProperties.push(assignment);
                                break;
                            case 'Body':
                                bodyArgProperties.push(assignment);
                                break;
                            case 'Param':
                                paramArgProperties.push(assignment);
                                break;
                        }
                    } else if (ts.isBlock(cnode)) {
                        const call = ts.createCall(ts.createIdentifier(ajaxName),
                            undefined, [
                                apiArg,
                                methodArg,
                                ts.createObjectLiteral(bodyArgProperties),
                                ts.createObjectLiteral(queryArgProperties),
                                ts.createObjectLiteral(paramArgProperties),
                            ]);
                        return ts.createBlock([ts.createReturn(call)]);
                    } else if (ts.isTypeReferenceNode(cnode)) {
                        const returnTypeNode = cnode.getChildAt(2);
                        if (returnTypeNode) {
                            usedIdentifierNames.add(returnTypeNode.getText());
                        }
                    }
                    return cnode;
                }, context);
            }
        }
        return node;
    };

    const transformController: ts.Visitor = (node: ts.Node) => {
        if (ts.isClassDeclaration(node)) {
            const prefix = getControllerPrefix(node.decorators);
            if (prefix !== undefined) {
                hasController = true;
                return ts.visitEachChild(node, (cnode: ts.Node) => transformMethod(cnode, prefix), context);
            }
        }
        return node;
    };

    const removeUnused = (node: ts.Node) => {
        if (!hasController) {
            return node;
        }
        if (ts.isDecorator(node)
            || ts.isConstructorDeclaration(node)
            || ts.isPropertyDeclaration(node)) {
            return null;
        } else if (ts.isImportDeclaration(node)) {
            const cntNode = node.getChildAt(1);
            if (cntNode) {
                const arr = cntNode.getText().replace(/[\{\}]/g, '').split(',').map((x) => x.trim());
                let unused = true;
                while (arr.length) {
                    const item = arr.pop();
                    unused = unused && !usedIdentifierNames.has(item);
                }
                if (unused) {
                    return null;
                }
            }
        }
        return ts.visitEachChild(node, removeUnused, context);
    };

    return (node) => ts.visitNode(
        node,
        (sourceFile) => ts.visitEachChild(
            ts.visitEachChild(sourceFile, transformController, context),
            removeUnused,
            context));
};

/**
 * 识别@Controller('')装饰器
 * @param decorators
 */
function getControllerPrefix(decorators: ts.NodeArray<ts.Decorator>): string | undefined {
    const arr = decorators
        && decorators.filter((dec) => dec.expression.getChildAt(0).getText().toLowerCase() === 'controller');
    if (arr && arr.length) {
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
        return [
            first.expression.getChildAt(2).getText().replace(/['"]/g, ''),
            first.expression.getChildAt(0).getText(),
        ];
    }
    return [null, null];
}

function resolveSupportedParam(node: ts.Node) {
    const first = node.getChildAt(0);
    const firstMatch = /@(Param|Query|Body)\((.*)\)$/.exec(first && first.getText());
    if (firstMatch) {
        const paramType = node.getChildAt(3);
        return {
            decoratorName: firstMatch[1],
            key: firstMatch[2],
            paramName: node.getChildAt(1).getText(),
            paramType: paramType && paramType.getText(),
        };
    }
}
