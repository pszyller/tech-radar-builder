export class RadarStage
{
    name: string;
    scale: number;
}

export class RadarConfig
{
    title: string;
    updateDate: string;
    contact: string;
    showItemsList: boolean;
    slices: Array<string>;
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