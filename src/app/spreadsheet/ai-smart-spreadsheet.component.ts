import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { grossPay } from './spreadsheetData';
import { isNullOrUndefined } from '@syncfusion/ej2-base';
import { AIAssistView, PromptRequestEventArgs } from '@syncfusion/ej2-interactive-chat';
import { createSpinner, showSpinner, hideSpinner } from '@syncfusion/ej2-popups';
import { serverAIRequest } from '../common/ai-service';
import { SheetModel, getCell, SpreadsheetAllModule } from '@syncfusion/ej2-angular-spreadsheet';
import { SidebarAllModule } from '@syncfusion/ej2-angular-navigations';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import {AIToastComponent} from '../common/ai-toast.component';
import { ToastModule } from '@syncfusion/ej2-angular-notifications';

@Component({
    selector: 'app-smart-spreadsheet',
    standalone: true,
    imports: [SpreadsheetAllModule, SidebarAllModule, ButtonModule, ToastModule, AIToastComponent],
    templateUrl: './ai-smart-spreadsheet.component.html',
    styleUrl: './ai-smart-spreadsheet.component.css'
})
export class SmartSpreadsheetComponent {
    constructor(@Inject('sourceFiles') private sourceFiles: any) {
        this.sourceFiles.files = [
          'ai-smart-spreadsheet.component.html',
          'ai-smart-spreadsheet.component.css',
        ];
      }
    @ViewChild('spreadsheet', { static: false }) spreadsheet!: ElementRef;
    @ViewChild('sidebar', { static: false }) sidebarObj!: ElementRef;
    @ViewChild('closebutton', { static: false }) closebutton!: ElementRef;
    public prompts: any[] = [
        { prompt: '', response: '' }
    ];
    public currentAIFeature: string = '';
    /* custom code start */
    public isAiTabCreated: boolean = false;
    /* custom code end */
    public aiinstance: any;
    public sheet: SheetModel[] = [
        {
            ranges: [{
                dataSource: grossPay,
                startCell: 'A3'
            },
            ],
            name: 'Gross Pay',
            rows: [{
                cells: [{
                    value: 'Gross Pay Calculation',
                    style: {
                        fontSize: '20pt', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#B3FFB3',
                        verticalAlign: 'middle'
                    }
                }]
            },
            {
                index: 3, cells: [{
                    index: 9, formula: '=B4+6',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            },
            {
                index: 4, cells: [{
                    index: 9, formula: '=B5+6',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            },
            {
                index: 5, cells: [{
                    index: 9, formula: '=B6+6',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            },
            {
                index: 6, cells: [{
                    index: 9, formula: '=B7+6',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            },
            {
                index: 7, cells: [{
                    index: 9, formula: '=B8+6',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            },
            {
                index: 8, cells: [{
                    index: 9, formula: '=B9+6',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            },
            {
                index: 9, cells: [{
                    index: 9, formula: '=B10+6',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            },
            {
                index: 10, cells: [{
                    index: 9, formula: '=B11+6',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            },
            {
                index: 11, cells: [{
                    index: 9, formula: '=B12+6',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            },
            {
                index: 12, cells: [{
                    index: 9, formula: '=B13+6',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            },
            {
                index: 13,
                cells: [{
                    index: 7, value: 'Total Gross',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                },
                {
                    index: 8, formula: '=Sum(I4:I13)', format: '$#,##0.00',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }, {
                    index: 9, formula: '=Sum(J4:J13)',
                    style: { border: '1px solid #A6A6A6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }
                }]
            }
            ],
            columns: [
                { width: 88, }, { width: 120 }, { width: 106 }, { width: 98 }, { width: 110 },
                { width: 110 }, { width: 110 }, { width: 98 }, { width: 130 }
            ]
        }];

    public height: string = "708px";
    public width = "500px";
    public target = "#spreadsheet-maincontent";
    public position = 'Right';

    public openUrl =  'https://document.syncfusion.com/web-services/spreadsheet-editor/api/spreadsheet/open';
    public saveUrl =  'https://document.syncfusion.com/web-services/spreadsheet-editor/api/spreadsheet/save';


    ngOninit() {
        (this.sidebarObj as any).toggle();
        const spinEle: HTMLElement = document.getElementById('spreadsheet') as HTMLElement;
        if (spinEle) {
            createSpinner({
                target: spinEle,
                cssClass: 'e-spin-large',
                width: '150px'
            });
        }
    }

    public btnClick(): void {
        (this.sidebarObj as any).hide();
    }
    /* custom code start */
    public onDataBound(): void {
        if (this.isAiTabCreated && (this.spreadsheet as any).ribbonModule && (this.spreadsheet as any).ribbonModule.ribbon &&
            (this.spreadsheet as any).ribbonModule.ribbon.items &&
            (this.spreadsheet as any).ribbonModule.ribbon.items[(this.spreadsheet as any).ribbonModule.ribbon.items.length - 1].header.text !== 'AI Assistant') {
            (this.spreadsheet as any).addRibbonTabs([{
                header: { text: 'AI Assistant' }, content: [
                    {
                        text: 'Full Sheet Analysis', tooltipText: 'Full Sheet Analysis',
                        click: (): void => {
                            this.fullSheetAnalysis();
                        }
                    },
                    {
                        text: 'Validate', tooltipText: 'Validate formulae',
                        click: (): void => {
                            this.formulaValidate();
                        }
                    },
                    {
                        text: 'Generate Formula', tooltipText: 'Generate Formula',
                        click: (): void => {
                            this.generateFormula();
                        }
                    }
                ]
            }]);
        }
    }
    /* custom code end */

    public created() {
        (this.spreadsheet as any).merge('A1:I2');
        (this.spreadsheet as any).setBorder({ border: '1px solid #A6A6A6' }, 'A1:I13');
        (this.spreadsheet as any).cellFormat({ textAlign: 'center', verticalAlign: 'middle' }, 'A3:I13');
        (this.spreadsheet as any).cellFormat({ backgroundColor: '#B3FFB3', fontWeight: 'bold' }, 'A3:I3');
        (this.spreadsheet as any).numberFormat('$#,##0.00', 'H4:I13');
        (this.spreadsheet as any).wrap('H3:I3');
        (this.spreadsheet as any).addRibbonTabs([{
            header: { text: 'AI Assistant' }, content: [
                {
                    text: 'Full Sheet Analysis', tooltipText: 'Full Sheet Analysis',
                    click: (): void => {
                        this.fullSheetAnalysis();
                    }
                },
                {
                    text: 'Validate', tooltipText: 'Validate formulae',
                    click: (): void => {
                        this.formulaValidate();
                    }
                },
                {
                    text: 'Generate Formula', tooltipText: 'Generate Formula',
                    click: (): void => {
                        this.generateFormula();
                    }
                }
            ]
        }],
        );
        /* custom code start */
        this.isAiTabCreated = true;
        /* custom code end */
        this.btnClick();
        (this.spreadsheet as any).addDataValidation({ type: 'Time', operator: 'LessThan', value1: '9:00:00 AM', ignoreBlank: false }, 'E4:E13');
        (this.spreadsheet as any).addDataValidation({ type: 'Time', operator: 'LessThan', value1: '6:00:00 PM', ignoreBlank: false }, 'F4:F13');
        (this.spreadsheet as any).addDataValidation({ type: 'WholeNumber', operator: 'LessThan', value1: '10', ignoreBlank: false }, 'G4:G13');
        (this.spreadsheet as any).addDataValidation({ type: 'WholeNumber', operator: 'LessThan', value1: '250', ignoreBlank: false }, 'H4:H13');
        (this.spreadsheet as any).addDataValidation({ type: 'WholeNumber', operator: 'LessThan', value1: '300', ignoreBlank: false }, 'I4:I13');

    }

    public fullSheetAnalysis() {
        if (this.currentAIFeature === 'formula' && !isNullOrUndefined(this.aiinstance)) {
            this.aiinstance.destroy();
            this.aiinstance = null;
        }
        this.currentAIFeature = 'analysis';
        const spinEle: HTMLElement = document.getElementById('spreadsheet') as HTMLElement;
        (this.spreadsheet as any).saveAsJson().then((data: any) => {
            try {
                showSpinner(spinEle);
                const processedString: string = this.processDataSource(data);
                let query: string = 'Analyze the full data in this data. ' + processedString;
                let aiOutput: any = serverAIRequest({ messages: [{ role: 'user', content: query }] });
                aiOutput.then((result: any) => {
                    if (result) {
                        result = this.markdownToPlainText(result);
                        this.renderAssistView(result);
                        (this.sidebarObj as any).show();
                    } else {
                        console.log('No result data from AI Service');
                    }
                    hideSpinner(spinEle);
                }).catch((error: any) => {
                    console.error('AI Analysis Error:', error);
                    hideSpinner(spinEle);
                });
            } catch (error: any) {
                console.error('Data processing error:', error);
                hideSpinner(spinEle);
            }            
        }).catch((error: any) => {
            console.error('Failed to save spreadsheet as JSON:', error);
            hideSpinner(spinEle);
        });
    }

    public formulaValidate() {
        const selectedCell: string = (this.spreadsheet as any).sheets[(this.spreadsheet as any).activeSheetIndex].selectedRange as string;
        let isFormulaAvailable: boolean = false;
        if (!isNullOrUndefined(selectedCell)) {
            const spinEle: HTMLElement = document.getElementById('spreadsheet') as HTMLElement;
            showSpinner(spinEle);            
            (this.spreadsheet as any).getData(selectedCell).then((data: any) => {
                try {
                    const currentCells: string[] = Array.from(data.keys());
                    let query: string = 'Validate the below formulae and provide me the problem in it. Strictly provide the data for each validated response in a flat JSON with fields `cell` to hold the spreadsheet cell value and `response` to hold the problem and solution.';
                    for (let a = 0; a < currentCells.length; a++) {
                        const cellFormula: string = data.get(currentCells[a]).formula;
                        if (!isNullOrUndefined(cellFormula)) {
                            isFormulaAvailable = true;
                            query += 'Spreadsheet cell - ' + currentCells[a] + ' - Formula - ' + cellFormula + ' - ' + this.processString(cellFormula);
                        }
                    }
                    if (isFormulaAvailable) {
                        let aiOutput: any = serverAIRequest({ messages: [{ role: 'user', content: query }] });
                        aiOutput.then((result: any) => {
                            if (result) {
                                let cleanedResponseText = result.split('```json')[1].trim();
                                cleanedResponseText = cleanedResponseText.split("```")[0].trim();
                                const responseJson: any[] = JSON.parse(cleanedResponseText);
                                for (let a = 0; a < responseJson.length; a++) {
                                    (this.spreadsheet as any).updateCell({ notes: { text: (responseJson[a] as any).response } }, (responseJson[a] as any).cell);
                                }
                            } else {
                                console.error('No result from AI service. AI Parse error');
                            }
                            hideSpinner(spinEle);
                        }).catch((error: any) => {
                            console.error('AI Analysis Error:', error);
                            hideSpinner(spinEle);
                        });
                    } else {
                        hideSpinner(spinEle);
                        console.log('No formulas found in the selected cells. Please select cells containing formulas to validate.');
                    }
                } catch (error: any) {
                    console.error('Formula validation error:', error);
                    hideSpinner(spinEle);
                }
            }).catch((error: any) => {
                console.error('Failed to get spreadsheet data:', error);
                hideSpinner(spinEle);
            });
        }
    }

    public generateFormula() {
        if (this.currentAIFeature === 'analysis' && !isNullOrUndefined(this.aiinstance)) {
            this.aiinstance.destroy();
            this.aiinstance = null;
        }
        this.currentAIFeature = 'formula';
        this.renderAssistViewForFormula(this.prompts);
        (this.sidebarObj as any).show();
    }

    public renderAssistViewForFormula(response: any) {
        if (isNullOrUndefined(this.aiinstance)) {
            this.aiinstance = new AIAssistView({
                promptPlaceholder: "Type your prompt for assistance...",
                prompts: this.prompts,
                promptRequest: this.promptHandler
            });
            this.aiinstance.appendTo('#defaultAIAssistView');
        }
    }

    public promptHandler = (args: PromptRequestEventArgs): void => {
        let prompt: string = args.prompt as string;
        (this.spreadsheet as any).saveAsJson().then((data: any) => {
            const processedString: string = this.processDataSource(data);
            let query: string = prompt + '. Strictly provide the excel formula for the Excel sheet data which is provided as JSON below. /n' + processedString;
            let aiOutput: any = serverAIRequest({ messages: [{ role: 'user', content: query }] });
            aiOutput.then((result: any) => {
                if (result) {
                    let cleanedResponseText = result.split('```excel')[1].trim();
                    cleanedResponseText = cleanedResponseText.split('```')[0].trim();
                    this.aiinstance.addPromptResponse(cleanedResponseText);
                } else {
                    console.error('No response from AI service. AI Parse error');
                }
            }).catch((error: any) => {
                console.error('AI Analysis Error:', error);
            });
        });
    }

    public removeKeys(array: any[], keysToRemove: string[], cellsKeys?: string[]) {
        array.forEach(obj => {
            keysToRemove.forEach((key: string) => {
                if (key === 'cells') {
                    if (obj && obj.cells && obj.cells.length > 0) {
                        this.removeKeys(obj.cells, (cellsKeys as string[]));
                    }
                } else {
                    if (obj && obj[key]) {
                        delete obj[key];
                    }
                }
            });
        });
        return array;
    }

    public processDataSource(data: any): string {
        const dataSource: any = this.removeKeys(data.jsonObject.Workbook.sheets[(this.spreadsheet as any).activeSheetIndex].rows, ['height', 'cells'], ['style', 'wrap', 'validation', 'colSpan', 'rowSpan']);
        const processedString: string = JSON.stringify(dataSource);
        return (processedString as any).replaceAll('{}', null);
    }

    public renderAssistView(response: any) {
        if (isNullOrUndefined(this.aiinstance)) {
            this.aiinstance = new AIAssistView({
                promptPlaceholder: "Type your prompt for assistance...",
                prompts: [{ prompt: '', response: response }]
            });
            this.aiinstance.appendTo('#defaultAIAssistView');
        } else {
            this.aiinstance.addPromptResponse(response);
        }
    }

    public processString(forumlaString: string): string {
        let processedString: string = '';
        const regex = /\(([^)]+)\)/g;
        let matches: any[] = [];
        let match;
        while ((match = regex.exec(forumlaString)) !== null) {
            let text = match[1];
            matches = text.split(/[:+\-*=/]/).map(s => s.trim()).filter(s => s !== '');
        }
        if (isNullOrUndefined(matches) || matches.length <= 0) {
            matches = forumlaString.split(/[:+\-*=/]/).map(s => s.trim()).filter(s => s !== '');
        }
        if (matches.length > 0) {
            for (let i: number = 0; i < matches.length; i++) {
                let { rowIndex, columnIndex } = this.cellAddressToIndexes(matches[i]);
                if (rowIndex != null && columnIndex != null) {
                    processedString += 'Value of the cell ' + matches[i] + ' is ' + getCell(rowIndex, columnIndex, (this.spreadsheet as any).sheets[(this.spreadsheet as any).activeSheetIndex]).value + '/n';
                }
            }
        }
        return processedString;
    }

    public cellAddressToIndexes(cellAddress: string) {
        const match = cellAddress.match(/^([A-Z]+)(\d+)$/);
        if (!match) {
            let rowIndex = null;
            let columnIndex = null;
            return { rowIndex, columnIndex };
        }
        const columnLetters = match[1];
        const rowNumber = parseInt(match[2], 10);
        let columnIndex = 0;
        for (let i = 0; i < columnLetters.length; i++) {
            columnIndex = columnIndex * 26 + (columnLetters.charCodeAt(i) - 'A'.charCodeAt(0));
        }
        const rowIndex = rowNumber - 1;
        return { rowIndex, columnIndex };
    }

    public markdownToPlainText(markdown: string) {
        markdown = markdown.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
        markdown = markdown.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
        markdown = markdown.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
        markdown = markdown.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        markdown = markdown.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        markdown = markdown.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        markdown = markdown.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        markdown = markdown.replace(/\*(.+?)\*/g, '<em>$1</em>');
        markdown = markdown.replace(/^\* (.+)$/gm, '<ul><li>$1</li></ul>');
        markdown = markdown.replace(/^\d+\. (.+)$/gm, '<ol><li>$1</li></ol>');
        markdown = markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        markdown = markdown.replace(/\n/g, '<br>');
        markdown = '<p>' + markdown + '</p>';
        return markdown;
    }
}
