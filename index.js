// Constants for the maximum number of minutes in a day
const MAX_IN_PERIOD = 1440;

// Valid states for simple and auto-off cases
const VALID_STATES_SIMPLE = ["on", "off"];
const VALID_STATES = ["on", "off", "auto-off"];
// error messages
const INVALID_PROFILE_ERROR = "Invalid profile: profile must be an object.";
const INVALID_EVENT_TIMESTAMP_ERROR =
  "Invalid event: timestamp must be a number between 0 and 1439.";
const INVALID_EVENTS_ERROR =
  "Invalid profile: must include an array of events.";
const INVALID_STATE_ERROR = (validStates) =>
  `Invalid event: state must be one of ${validStates.join(", ")}.`;

// Validation for individual events
const isEventValid = (event, validStates) => {
  if (
    typeof event.timestamp !== "number" ||
    event.timestamp < 0 ||
    event.timestamp >= MAX_IN_PERIOD
  ) {
    throw new Error(INVALID_EVENT_TIMESTAMP_ERROR);
  }
  if (!validStates.includes(event.state)) {
    throw new Error(INVALID_STATE_ERROR(validStates));
  }
  return true;
};

// Validation for the overall profile
const isProfileValid = (profile, validStates) => {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new Error(INVALID_PROFILE_ERROR);
  }

  if (!Array.isArray(profile.events)) {
    throw new Error(INVALID_EVENTS_ERROR);
  }

  if (!validStates.includes(profile.initial)) {
    throw new Error(INVALID_STATE_ERROR(validStates));
  }

  return true;
};

/**
 * PART 1
 *
 * You have an appliance that uses energy, and you want to calculate how
 * much energy it uses over a period of time.
 *
 * As an input to your calculations, you have a series of events that contain
 * a timestamp and the new state (on or off). You are also given the initial
 * state of the appliance. From this information, you will need to calculate
 * the energy use of the appliance i.e. the amount of time it is switched on.
 *
 * The amount of energy it uses is measured in 1-minute intervals over the
 * period of a day. Given there is 1440 minutes in a day (24 * 60), if the
 * appliance was switched on the entire time, its energy usage would be 1440.
 * To simplify calculations, timestamps range from 0 (beginning of the day)
 * to 1439 (last minute of the day).
 *
 * HINT: there is an additional complication with the last two tests that
 * introduce spurious state change events (duplicates at different time periods).
 * Focus on getting these tests working after satisfying the first tests.
 *
 * The structure for `profile` looks like this (as an example):
 * ```
 * {
 *    initial: 'on',
 *    events: [
 *      { state: 'off', timestamp: 50 },
 *      { state: 'on', timestamp: 304 },
 *      { state: 'off', timestamp: 600 },
 *    ]
 * }
 * ```
 */

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
  // Validate profile structure and values
  isProfileValid(profile, VALID_STATES_SIMPLE);

  let totalEnergy = 0;
  let previousEventTimestamp = 0;
  // Appliance starts in the given initial state
  let previousStateWasOn = profile.initial === "on";

  // Iterate through events to calculate total "on" time
  for (const event of profile.events) {
    isEventValid(event, VALID_STATES_SIMPLE);

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
 * PART 2
 *
 * You purchase an energy-saving device for your appliance in order
 * to cut back on its energy usage. The device is smart enough to shut
 * off the appliance after it detects some period of disuse, but you
 * can still switch on or off the appliance as needed.
 *
 * You are keen to find out if your shiny new device was a worthwhile
 * purchase. Its success is measured by calculating the amount of
 * energy *saved* by device.
 *
 * To assist you, you now have a new event type that indicates
 * when the appliance was switched off by the device (as opposed to switched
 * off manually). Your new states are:
 * * 'on'
 * * 'off' (manual switch off)
 * * 'auto-off' (device automatic switch off)
 *
 * (The `profile` structure is the same, except for the new possible
 * value for `initial` and `state`.)
 *
 * Write a function that calculates the *energy savings* due to the
 * periods of time when the device switched off your appliance. You
 * should not include energy saved due to manual switch offs.
 *
 * You will need to account for redundant/non-sensical events e.g.
 * an off event after an auto-off event, which should still count as
 * an energy savings because the original trigger was the device
 * and not manual intervention.
 */

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
  isProfileValid(profile, VALID_STATES);

  let totalEnergySaved = 0;
  let previousStateWasOn = profile.initial === "on";
  let autoOffWasTriggered = profile.initial === "auto-off";
  let autoOffTimestamp = 0;

  for (const event of profile.events) {
    isEventValid(event, VALID_STATES);

    if (autoOffWasTriggered && event.state === "on") {
      // Appliance turns back "on" after an auto-off, so calculate saved energy
      totalEnergySaved += event.timestamp - autoOffTimestamp;
      autoOffWasTriggered = false;
    } else if (event.state === "auto-off" && previousStateWasOn) {
      // Start tracking energy savings when auto-off is triggered
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
 *
 * The process of producing metrics usually requires handling multiple days of data. The
 * examples so far have produced a calculation assuming the day starts at '0' for a single day.
 *
 * In this exercise, the timestamp field contains the number of minutes since a
 * arbitrary point in time (the "Epoch"). To simplify calculations, assume:
 *  - the Epoch starts at the beginning of the month (i.e. midnight on day 1 is timestamp 0)
 *  - our calendar simply has uniform length 'days' - the first day is '1' and the last day is '365'
 *  - the usage profile data will not extend more than one month
 *
 * Your function should calculate the energy usage over a particular day, given that
 * day's number. It will have access to the usage profile over the month.
 *
 * It should also throw an error if the day value is invalid i.e. if it is out of range
 * or not an integer. Specific error messages are expected - see the tests for details.
 *
 * (The `profile` structure is the same as part 1, but remember that timestamps now extend
 * over multiple days)
 *
 * HINT: You are encouraged to re-use `calculateEnergyUsageSimple` from PART 1 by
 * constructing a usage profile for that day by slicing up and rewriting up the usage profile you have
 * been given for the month.
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
 * This function slices out the relevant events for the specified day from `monthUsageProfile`
 * and calculates total energy usage based on those events.
 *
 * Edge Cases:
 * - If the initial state is "on" and no events exist within the day, assumes full-day usage.
 * - Multiple events at day boundaries are handled gracefully by filtering and mapping separately.
 *
 * @param {Object} monthUsageProfile - Profile with an initial state and list of timestamped events.
 * @param {number} day - Day of the month (1 to 365).
 * @returns {number} Total energy usage in minutes for the specified day.
 * @throws Error if day is invalid or monthUsageProfile is incorrectly structured.
 */
const calculateEnergyUsageForDay = (monthUsageProfile, day) => {
  isProfileValid(monthUsageProfile, VALID_STATES_SIMPLE);
  validateDay(day);

  const dayStart = (day - 1) * MAX_IN_PERIOD;
  const dayEnd = day * MAX_IN_PERIOD - 1;

  // Determine initial state for the start of the specified day
  let initialState = monthUsageProfile.initial;
  for (const event of monthUsageProfile.events) {
    if (event.timestamp >= dayStart) break;
    initialState = event.state;
  }

  // Extract events that fall within the specific day, adjusting timestamps
  const dayEvents = monthUsageProfile.events
    .filter((event) => event.timestamp >= dayStart && event.timestamp <= dayEnd)
    .map((event) => ({
      state: event.state,
      timestamp: event.timestamp - dayStart,
    }));

  return calculateEnergyUsageSimple({
    initial: initialState,
    events: dayEvents,
  });
};

module.exports = {
  INVALID_PROFILE_ERROR,
  INVALID_EVENTS_ERROR,
  INVALID_STATE_ERROR,
  calculateEnergyUsageSimple,
  calculateEnergySavings,
  calculateEnergyUsageForDay,
  VALID_STATES,
  VALID_STATES_SIMPLE,
  MAX_IN_PERIOD,
};
