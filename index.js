// Constants for the maximum number of minutes in a day
const MAX_IN_PERIOD = 1440;

// Valid states for simple and auto-off cases
const VALID_STATES_SIMPLE = ["on", "off"];
const VALID_STATES = ["on", "off", "auto-off"];

// Error messages
const INVALID_PROFILE_ERROR = "Invalid profile: profile must be an object.";
const INVALID_EVENT_TIMESTAMP_ERROR =
  "Invalid event: timestamp must be a number between 0 and 1439.";
const INVALID_EVENTS_ERROR =
  "Invalid profile: must include an array of events.";
const getInvalidStateError = (validStates) =>
  `Invalid event: state must be one of ${validStates.join(", ")}.`;

// Validation for individual events
const validateEvent = (event, validStates) => {
  if (
    typeof event.timestamp !== "number" ||
    event.timestamp < 0 ||
    event.timestamp >= MAX_IN_PERIOD
  ) {
    throw new Error(INVALID_EVENT_TIMESTAMP_ERROR);
  }
  if (!validStates.includes(event.state)) {
    throw new Error(getInvalidStateError(validStates));
  }
  return true;
};

// Validation for the overall profile
const validateProfile = (profile, validStates) => {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new Error(INVALID_PROFILE_ERROR);
  }

  if (!Array.isArray(profile.events)) {
    throw new Error(INVALID_EVENTS_ERROR);
  }

  if (!validStates.includes(profile.initial)) {
    throw new Error(getInvalidStateError(validStates));
  }

  return true;
};

/**
 * Calculates the total energy usage for an appliance based on its on/off events over a day.
 *
 * The function takes a profile object containing an initial state and a series of events
 * with timestamps and states. It calculates the cumulative "on" time for the appliance
 * by iterating through each event and adding the duration of each "on" period.
 *
 * Edge Cases:
 * - If the appliance starts "on" and has no events, it will consume energy for the entire day.
 * - If there are duplicate events with the same timestamp, each event is processed independently,
 *   but the timestamp difference will be zero, resulting in no additional energy usage for that duplicate.
 * - If the last event leaves the appliance "on," the function adds the remaining time in the day to the total.
 *
 * @param {Object} profile - The usage profile, containing:
 *   - {string} initial - Initial state ("on" or "off").
 *   - {Array} events - Array of event objects with `timestamp` (number) and `state` (string) properties.
 * @returns {number} Total energy usage in minutes for the day.
 * @throws Will throw an error if `profile` is invalid or contains invalid events.
 */
const calculateEnergyUsageSimple = (profile) => {
  validateProfile(profile, VALID_STATES_SIMPLE);

  let totalEnergy = 0;
  let previousEventTimestamp = 0;
  // Appliance starts in the given initial state
  let previousStateWasOn = profile.initial === "on";

  for (const event of profile.events) {
    validateEvent(event, VALID_STATES_SIMPLE);

    // If the appliance was "on" prior to this event, add the time since the last event
    if (previousStateWasOn) {
      totalEnergy += event.timestamp - previousEventTimestamp;
    }

    // Update state and timestamp for the next cycle
    previousStateWasOn = event.state === "on";
    previousEventTimestamp = event.timestamp;
  }

  // If appliance remains "on" after the last event, add the remaining minutes until the end of the day
  if (previousStateWasOn) {
    totalEnergy += MAX_IN_PERIOD - previousEventTimestamp;
  }

  return totalEnergy;
};

/**
 * Calculates the energy saved by the appliance due to automatic "auto-off" events.
 *
 * This function tracks energy savings for periods when the appliance is turned off
 * automatically (via 'auto-off') but excludes savings from manual 'off' events.
 *
 * Edge Cases:
 * - If the appliance is initially in "auto-off," savings begin from the start of the day.
 * - If "auto-off" is followed by manual "off" events, only the original auto-off savings count.
 * - If the appliance remains in "auto-off" state at the end of the day, remaining minutes are counted as saved.
 *
 * @param {Object} profile - Usage profile with initial state and list of events.
 * @returns {number} Total energy saved in minutes for the day due to auto-off events.
 * @throws Error if profile or events are invalid.
 */
const calculateEnergySavings = (profile) => {
  validateProfile(profile, VALID_STATES);

  let totalEnergySaved = 0;
  let previousStateWasOn = profile.initial === "on";
  let autoOffWasTriggered = profile.initial === "auto-off";
  let autoOffTimestamp = 0;

  for (const event of profile.events) {
    validateEvent(event, VALID_STATES);

    // Appliance turns back "on" after an auto-off, so calculate saved energy
    if (autoOffWasTriggered && event.state === "on") {
      totalEnergySaved += event.timestamp - autoOffTimestamp;
      autoOffWasTriggered = false;
      // Start tracking energy savings when auto-off is triggered
    } else if (event.state === "auto-off" && previousStateWasOn) {
      autoOffWasTriggered = true;
      autoOffTimestamp = event.timestamp;
    }
    // If the state is "off," no action is required
    previousStateWasOn = event.state === "on";
  }

  // If appliance remains in "auto-off" at day's end, add remaining saved time
  if (autoOffWasTriggered) {
    totalEnergySaved += MAX_IN_PERIOD - autoOffTimestamp;
  }

  return totalEnergySaved;
};

/**
 * PART 3
 */

const isInteger = (number) => Number.isInteger(number);

// Validate the day input
const validateDay = (day) => {
  if (!isInteger(day)) {
    throw new Error("Day must be an integer.");
  }
  if (day < 1 || day > 365) {
    throw new Error("day out of range");
  }
};

/**
 * Calculates the energy usage for a specific day based on a timestamp profile for the month.
 *
 * This function iterates through all events only once to:
 * - Determine the initial state for the specified day
 * - Collect relevant events within the day's time range, adjusting timestamps
 *
 * Edge Cases:
 * - If the initial state is "on" and no events exist within the day, assumes full-day usage.
 * - Handles events on day boundaries efficiently.
 *
 * @param {Object} monthUsageProfile - Profile with an initial state and list of timestamped events.
 * @param {number} day - Day of the month (1 to 365).
 * @returns {number} Total energy usage in minutes for the specified day.
 * @throws Error if day is invalid or monthUsageProfile is incorrectly structured.
 */
const calculateEnergyUsageForDay = (monthUsageProfile, day) => {
  validateProfile(monthUsageProfile, VALID_STATES_SIMPLE);
  validateDay(day);

  const dayStart = (day - 1) * MAX_IN_PERIOD;
  const dayEnd = day * MAX_IN_PERIOD - 1;

  let initialState = monthUsageProfile.initial;
  const dayEvents = [];

  // Iterate through events to set initial state and filter relevant day events
  for (const event of monthUsageProfile.events) {
    if (event.timestamp < dayStart) {
      // Update initial state based on events prior to the day's start
      initialState = event.state;
    } else if (event.timestamp <= dayEnd) {
      // Adjust timestamp for events within the day's range and add to dayEvents
      dayEvents.push({
        state: event.state,
        timestamp: event.timestamp - dayStart,
      });
    } else {
      // Break early as remaining events exceed the day's range
      break;
    }
  }

  return calculateEnergyUsageSimple({
    initial: initialState,
    events: dayEvents,
  });
};

module.exports = {
  INVALID_PROFILE_ERROR,
  INVALID_EVENTS_ERROR,
  getInvalidStateError,
  calculateEnergyUsageSimple,
  calculateEnergySavings,
  calculateEnergyUsageForDay,
  VALID_STATES,
  VALID_STATES_SIMPLE,
  MAX_IN_PERIOD,
};
