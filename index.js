/* The maximum number of minutes in a period (a day) */

const MAX_IN_PERIOD = 1440;
const VALID_STATES_SIMPLE = ["on", "off"];
const VALID_STATES = ["on", "off", "auto-off"];

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

// Validation for individual events
const isEventValidSimple = (event) =>
  typeof event.timestamp === "number" &&
  VALID_STATES_SIMPLE.includes(event.state) &&
  event.timestamp >= 0 &&
  event.timestamp <= MAX_IN_PERIOD;

// Validation for the overall profile
const isProfileValid = (profile, validStates) =>
  profile &&
  Array.isArray(profile.events) &&
  validStates.includes(profile.initial);

const calculateEnergyUsageSimple = (profile) => {
  if (!isProfileValid(profile, VALID_STATES_SIMPLE)) {
    return undefined;
  }

  let totalEnergy = 0;
  let previousTimestamp = 0;
  let isOn = profile.initial === "on";

  for (let event of profile.events) {
    if (!isEventValidSimple(event)) {
      return undefined;
    }

    if (isOn) {
      totalEnergy += event.timestamp - previousTimestamp;
    }

    isOn = event.state === "on";
    previousTimestamp = event.timestamp;
  }

  if (isOn) {
    totalEnergy += MAX_IN_PERIOD - previousTimestamp;
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

// Validation for individual events with auto-off
const isEventValid = (event) =>
  typeof event.timestamp === "number" &&
  VALID_STATES.includes(event.state) &&
  event.timestamp >= 0 &&
  event.timestamp <= MAX_IN_PERIOD;

const calculateEnergySavings = (profile) => {
  if (!isProfileValid(profile, VALID_STATES)) {
    return undefined;
  }

  let energySaved = 0;
  let isOn = profile.initial === "on";
  let autoOffTriggered = profile.initial === "auto-off";
  let autoOffTimestamp = 0;

  for (let event of profile.events) {
    if (!isEventValid(event)) {
      return undefined;
    }

    if (autoOffTriggered && event.state === "on") {
      energySaved += event.timestamp - autoOffTimestamp;
      autoOffTriggered = false;
    }

    if (event.state === "auto-off" && isOn) {
      autoOffTriggered = true;
      autoOffTimestamp = event.timestamp;
    }

    isOn = event.state === "on";
  }

  if (autoOffTriggered) {
    energySaved += MAX_IN_PERIOD - autoOffTimestamp;
  }

  return energySaved;
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

// Validate the day input
const validateDay = (day) => {
  if (!isInteger(day)) {
    throw new Error("must be an integer");
  }
  if (day < 1 || day > 365) {
    throw new Error("day out of range");
  }
};

// Calculate the initial state for a specific day
const getInitialStateForDay = (monthUsageProfile, dayStart) => {
  let initialState = monthUsageProfile.initial;
  for (let event of monthUsageProfile.events) {
    if (event.timestamp >= dayStart) break;
    initialState = event.state;
  }
  return initialState;
};

const calculateEnergyUsageForDay = (monthUsageProfile, day) => {
  if (!isProfileValid(monthUsageProfile, VALID_STATES_SIMPLE)) {
    return undefined;
  }
  validateDay(day);

  const dayStart = (day - 1) * MAX_IN_PERIOD;
  const dayEnd = day * MAX_IN_PERIOD - 1;

  const dayEvents = monthUsageProfile.events
    .filter((event) => event.timestamp >= dayStart && event.timestamp <= dayEnd)
    .map((event) => ({
      state: event.state,
      timestamp: event.timestamp - dayStart,
    }));

  const initialState = getInitialStateForDay(monthUsageProfile, dayStart);

  return calculateEnergyUsageSimple({
    initial: initialState,
    events: dayEvents,
  });
};

module.exports = {
  calculateEnergyUsageSimple,
  calculateEnergySavings,
  calculateEnergyUsageForDay,
  MAX_IN_PERIOD,
};
