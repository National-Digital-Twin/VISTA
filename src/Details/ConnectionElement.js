class Element {
  constructor(element) {
    this.desc = element.desc;
    this.asset = element;
  }
}

export class ConnectionElement extends Element {
  constructor(element) {
    super(element);
    const { label, criticality, sourceAsset, targetAsset, source, target } =
      element;
    this.name = label;
    this.sub = label;
    this.title = label;
    this.titleClassName = `link-crit-${criticality}`;
    this.connPrefix = "connects ";
    this.connSourceName = source ? sourceAsset.name : undefined;
    this.connSourceStyle = source
      ? { color: sourceAsset.scoreColour }
      : undefined;
    this.connLink = " and ";
    this.connTargetName = target ? targetAsset.name : undefined;
    this.connTargetStyle = target
      ? { color: targetAsset.scoreColour }
      : undefined;
  }
}

export class AssetElement extends Element {
  constructor(element) {
    const { name, scoreColour, id } = element;
    super(element);
    this.name = name;
    this.sub = name;
    this.title = id;
    this.titleStyle = { color: scoreColour };
    this.subStyle = { color: scoreColour };
  }
}
