/**
 * Raw result from Api /assessments?assets
 * @typedef {Object} AssetAssessmentApiResult
 * @property {String} id
 * @property {String} lat
 * @property {String} lon
 * @property {String} name
 * @property {String} type
 * @property {String} uri
 */

/**
 * Raw result from Api /assessments?connections
 * @typedef {Object} ConnectionAssessmentApiResult
 * @property {String} asset1Uri
 * @property {String} asset2Uri
 * @property {String} connUri
 * @property {String} criticality
 */

/**
 * Object of AssetInstances use the asset uri as
 * the key value
 * @typedef {Object} AssetInstances
 * @property {Asset} AssetUri
 */

/**
 * @typedef {Object} AssessmentCategory
 * @property {String} assCount
 * @property {String} name
 * @property {String} uri
 */
