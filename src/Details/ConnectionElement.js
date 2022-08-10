class Element {
  constructor({ desc, element, name, title }) {
    this.desc = desc;
    this.asset = element;
    this.name = name;
    this.title = title;
  }
}

export class ConnectionElement extends Element {
  constructor(element) {
    const {
      criticality,
      desc,
      label,
      source,
      sourceAsset,
      target,
      targetAsset,
    } = element;

    super({ element, desc, name: label, title: label });

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
    const { desc, id, name, scoreColour } = element;
    super({ desc, element, name, title: id });
    this.name = name;
    this.sub = name;
    this.title = id;
    this.titleStyle = { color: scoreColour };
    this.subStyle = { color: scoreColour };
  }
}
