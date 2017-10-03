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

export class RadarDataItemDef
{
    stageId: number;
    title: string;
    desc: string;
    size: number;
    x: number;
    y: number;
}

export class RadarDataItem
{
    sliceId: number;
    data: Array<RadarDataItemDef>;
}

export class RadarDefinition
{   
    key: string;
    config : RadarConfig;
    data: Array<RadarDataItem>;
}

export class ViewSettings
{
    readOnly:boolean;
}