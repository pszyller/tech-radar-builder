export class ScalableItem
{

    perc: number;
}

export class RadarStage extends ScalableItem
{
    name: string;

}

export class RadarSlice extends ScalableItem
{
    name: string;

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
    title: string;
    desc: string;
    stage: string;
    x: number;
    y: number;
}

export class RadarDataItem
{
    slice: string;
    data: Array<RadarDataItemDef>;
}

export class RadarDefinition
{   
    key: string;
    config : RadarConfig;
    data: Array<RadarDataItem>;
}