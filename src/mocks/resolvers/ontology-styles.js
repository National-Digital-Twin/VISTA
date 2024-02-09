const styles = [
  {
    cls: {
      type: "uri",
      value: "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
    },
    style: {
      type: "literal",
      value:
        '{"defaultStyles": {"dark": {"backgroundColor": "#242400", "color": "#FFFD04"}, "light": {"backgroundColor": "#FFFD04", "color": "#242400"}, "shape": "circle", "borderRadius": "9999px", "borderWidth": "2px", "selectedBorderWidth": "3px"}, "defaultIcons": {"riIcon": "ri-cloudy-fill", "faIcon": "fa-solid fa-utility-pole-double", "faUnicode": "\\ue2c4", "faClass": "fa-solid"}}',
    },
  },
  {
    cls: {
      type: "uri",
      value: "http://ies.data.gov.uk/ontology/ies4#OilFiredPowerGenerationComplex",
    },
    style: {
      type: "literal",
      value:
        '{"defaultStyles": {"dark": {"backgroundColor": "#242400", "color": "#FFFD04"}, "light": {"backgroundColor": "#FFFD04", "color": "#242400"}, "shape": "circle", "borderRadius": "9999px", "borderWidth": "2px", "selectedBorderWidth": "3px"}, "defaultIcons": {"riIcon": "ri-cloudy-fill", "faIcon": "fa-regular fa-bolt-lightning", "faUnicode": "\\ue0b7", "faClass": "fa-regular"}}',
    },
  },
  {
    cls: {
      type: "uri",
      value: "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex",
    },
    style: {
      type: "literal",
      value:
        '{"defaultStyles": {"dark": {"backgroundColor": "#242400", "color": "#FFFD04"}, "light": {"backgroundColor": "#FFFD04", "color": "#242400"}, "shape": "circle", "borderRadius": "9999px", "borderWidth": "2px", "selectedBorderWidth": "3px"}, "defaultIcons": {"riIcon": "ri-cloudy-fill", "faIcon": "fa-solid fa-utility-pole", "faUnicode": "\\ue0b7", "faClass": "fa-solid"}}',
    },
  },
];

const ontologyClass = (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json({
      head: {
        vars: ["cls", "style"],
      },
      results: {
        bindings: styles,
      },
    })
  );
};

export default ontologyClass;
