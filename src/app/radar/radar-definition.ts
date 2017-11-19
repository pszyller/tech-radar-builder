export class ScalableItem
{
    id : number;
    perc: number;
}

export class RadarStage extends ScalableItem
{
    name: string;
}

export class RadarSlice extends ScalableItem
{
    name: string;
    color: string;

    public constructor(init?:Partial<RadarSlice>) {
        super();
        Object.assign(this, init);
        this.color = "#EEEEEE";
    }
}

export class RadarConfig
{
    title: string;
    updateDate: string;
    contact: string;
    showItemsList: boolean;
    slices: Array<RadarSlice>;
    stages: Array<RadarStage>;
}

export class HistoryItem
{
    log: string;
    date: Date;
    stageId: number;
    x: number;
    y: number;  
}

export class RadarDataItemDef
{
    stageId: number;
    title: string;
    desc: string;
    size: number;
    shape: string = "circle.svg";
    color: string = "#FF0000";
    alwaysShowTitle:boolean;
    x: number;
    y: number;
    history :Array<HistoryItem> = new Array<HistoryItem>();
}

export class RadarDataItem
{
    sliceId: number;
    data: Array<RadarDataItemDef>;
}

export class RadarDefinition
{   
    key: string;
    config : RadarConfig = new RadarConfig();
    data: Array<RadarDataItem>;
}

export class ViewSettings
{
    readOnly:boolean;
}