class Element {
  constructor(element) {
    this.desc = element.desc;
    this.asset = element;
  }
}

export class ConnectionElement extends Element {
  constructor(element) {
    super(element);
    this.name = element.label;
    this.sub = element.label;
    this.title = element.label;
    this.titleClassName = `link-crit-${element.criticality}`;
    this.connPrefix = "connects ";
    this.connSourceName = element.source ? element.sourceAsset.name : undefined;
    this.connSourceStyle = element.source
      ? { color: element.sourceAsset.scoreColour }
      : undefined;
    this.connLink = " and ";
    this.connTargetName = element.target ? element.targetAsset.name : undefined;
    this.connTargetStyle = element.target
      ? { color: element.targetAsset.scoreColour }
      : undefined;
  }
}

export class AssetElement extends Element {
  constructor(element) {
    super(element);
    this.name = element.name;
    this.sub = element.name;
    this.title = element.id;
    this.titleStyle = { color: element.scoreColour };
    this.subStyle = { color: element.scoreColour };
  }
}
