/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {string} message
 * @property {any} [data]
 */

/**
 * @typedef {Object} AuthUser
 * @property {number|null} userId
 * @property {string} fullName
 * @property {string} email
 * @property {"Admin"|"Doctor"|"Patient"} role
 */

/**
 * @typedef {Object} AppointmentUIModel
 * @property {number} appointmentId
 * @property {number} patientId
 * @property {string} patientName
 * @property {number} doctorId
 * @property {string} doctorName
 * @property {string} departmentName
 * @property {string} appointmentTime
 * @property {string} appointmentTimeText
 * @property {string} status
 */
