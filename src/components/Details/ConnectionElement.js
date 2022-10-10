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
    const { criticality, desc, label, source, sourceAsset, target, targetAsset } = element;

    super({ element, desc, name: label, title: label });

    this.id = label;
    this.title = `${sourceAsset.name} - ${targetAsset.name}`;
    this.criticality = criticality;
    this.titleClassName = `link-crit-${criticality}`;
    this.connSourceName = source ? sourceAsset.name : undefined;
    this.sourceCriticality = sourceAsset.criticality;
    this.connSourceStyle = source ? { color: sourceAsset.scoreColour } : undefined;
    this.connTargetName = target ? targetAsset.name : undefined;
    this.targetCriticality = targetAsset.criticality;
    this.connTargetStyle = target ? { color: targetAsset.scoreColour } : undefined;
    this.connectedSourceAsset = {
      name: sourceAsset.name,
      id: sourceAsset.id,
      criticality: sourceAsset.criticality,
      colour: sourceAsset.countColour,
    };
    this.connectedtargetAsset = {
      name: targetAsset.name,
      id: targetAsset.id,
      criticality: targetAsset.criticality,
      colour: targetAsset.countColour,
    };
  }
  get connectedAssets() {
    return [{ ...this.connectedSourceAsset }, { ...this.connectedtargetAsset }];
  }
}

export class AssetElement extends Element {
  constructor(element) {
    const { desc, id, name, scoreColour } = element;
    super({ desc, element, name, title: id });
    this.id = id;
    this.title = name;
    this.latitude = element.lat;
    this.longitude = element.lon;
    this.criticality = element.criticality;
    this.titleStyle = { color: scoreColour };
    this.subStyle = { color: scoreColour };
    this.totalConnections = element.count;
  }

  get connectedAssets() {
    const sourceConn = this.asset.connectionList
      ?.filter((obj) => obj.sourceAsset.name !== this.title)
      .map((obj) => ({
        name: obj.sourceAsset.name,
        id: obj.sourceAsset.id,
        criticality: obj.sourceAsset.criticality,
        connCriticality: obj.criticality,
        colour: obj.sourceAsset.scoreColour,
      }));
    const targetConn = this.asset.connectionList
      ?.filter((obj) => obj.targetAsset.name !== this.title)
      .map((obj) => ({
        name: obj.targetAsset.name,
        id: obj.targetAsset.id,
        criticality: obj.targetAsset.criticality,
        connCriticality: obj.criticality,
        colour: obj.targetAsset.scoreColour,
      }));
    const connections = [...targetConn, ...sourceConn];
    return connections;
  }
}
