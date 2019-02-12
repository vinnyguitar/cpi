class TemplateController {
    public async templateFunction(param: any): Promise<any> {
        return window['cpiRequest']('url', 'method', param); // tslint:disable-line
    }
}

export const templateApi = new TemplateController();
