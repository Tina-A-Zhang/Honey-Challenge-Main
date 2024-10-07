const {
  calculateEnergyUsageSimple,
  calculateEnergySavings,
  calculateEnergyUsageForDay,
  MAX_IN_PERIOD,
  VALID_STATES,
  VALID_STATES_SIMPLE,
  INVALID_EVENTS_ERROR,
  INVALID_EVENT_TIMESTAMP_ERROR,
  INVALID_PROFILE_ERROR,
  getInvalidStateError,
} = require("./index");

// Part 1
describe("calculateEnergyUsageSimple", () => {
  it('should calculate correctly for a simple usage profile with initial state = "on"', () => {
    const usageProfile1 = {
      initial: "on",
      events: [
        { timestamp: 126, state: "off" },
        { timestamp: 833, state: "on" },
      ],
    };
    expect(calculateEnergyUsageSimple(usageProfile1)).toEqual(
      126 + (MAX_IN_PERIOD - 833)
    );
  });

  it('should calculate correctly for a simple usage profile with initial state = "off"', () => {
    const usageProfile2 = {
      initial: "off",
      events: [
        { timestamp: 30, state: "on" },
        { timestamp: 80, state: "off" },
        { timestamp: 150, state: "on" },
        { timestamp: 656, state: "off" },
      ],
    };
    expect(calculateEnergyUsageSimple(usageProfile2)).toEqual(
      80 - 30 + (656 - 150)
    );
  });

  it("should calculate correctly when the appliance is on the whole time", () => {
    const usageProfile3 = {
      initial: "on",
      events: [],
    };
    expect(calculateEnergyUsageSimple(usageProfile3)).toEqual(MAX_IN_PERIOD);
  });

  it("should handle duplicate on events", () => {
    const usageProfile = {
      initial: "off",
      events: [
        { timestamp: 30, state: "on" },
        { timestamp: 80, state: "on" },
        { timestamp: 150, state: "off" },
        { timestamp: 656, state: "on" },
      ],
    };
    expect(calculateEnergyUsageSimple(usageProfile)).toEqual(
      150 - 30 + (MAX_IN_PERIOD - 656)
    );
  });

  it("should handle duplicate off events", () => {
    const usageProfile = {
      initial: "on",
      events: [
        { timestamp: 30, state: "on" },
        { timestamp: 80, state: "off" },
        { timestamp: 150, state: "off" },
        { timestamp: 656, state: "on" },
      ],
    };
    expect(calculateEnergyUsageSimple(usageProfile)).toEqual(
      80 - 0 + (MAX_IN_PERIOD - 656)
    );
  });

  it("should calculate correctly when the appliance is off the whole time", () => {
    const usageProfile4 = {
      initial: "off",
      events: [],
    };
    expect(calculateEnergyUsageSimple(usageProfile4)).toEqual(0);
  });

  it("should calculate correctly when the last event occurs at the last minute", () => {
    const usageProfile7 = {
      initial: "on",
      events: [{ timestamp: 1439, state: "off" }],
    };
    expect(calculateEnergyUsageSimple(usageProfile7)).toEqual(1439);
  });

  it("should calculate correctly when events occur at the same timestamp", () => {
    const usageProfile8 = {
      initial: "on",
      events: [
        { timestamp: 300, state: "off" },
        { timestamp: 300, state: "on" },
        { timestamp: 900, state: "off" },
      ],
    };
    expect(calculateEnergyUsageSimple(usageProfile8)).toEqual(
      300 + (900 - 300)
    );
  });

  it("should calculate correctly with multiple on-off transitions", () => {
    const usageProfile9 = {
      initial: "off",
      events: [
        { timestamp: 100, state: "on" },
        { timestamp: 150, state: "off" },
        { timestamp: 200, state: "on" },
        { timestamp: 250, state: "off" },
        { timestamp: 300, state: "on" },
        { timestamp: 350, state: "off" },
      ],
    };
    expect(calculateEnergyUsageSimple(usageProfile9)).toEqual(
      150 - 100 + (250 - 200) + (350 - 300)
    );
  });

  it("should calculate correctly when the appliance is turned on with the last event", () => {
    const usageProfile10 = {
      initial: "off",
      events: [{ timestamp: 1000, state: "on" }],
    };
    expect(calculateEnergyUsageSimple(usageProfile10)).toEqual(
      MAX_IN_PERIOD - 1000
    );
  });

  it("should throw an error for an invalid initial state", () => {
    const usageProfile11 = {
      initial: "invalid-state",
      events: [],
    };
    expect(() => calculateEnergySavings(usageProfile11)).toThrow(
      getInvalidStateError(VALID_STATES)
    );
  });

  it("should throw an error for negative or invalid timestamps", () => {
    const usageProfile12 = {
      initial: "off",
      events: [
        { timestamp: -10, state: "on" },
        { timestamp: 500, state: "off" },
      ],
    };
    expect(() => calculateEnergyUsageSimple(usageProfile12)).toThrow(
      INVALID_EVENT_TIMESTAMP_ERROR
    );
  });

  it("should throw an error for timestamp out of range (above 1439)", () => {
    const usageProfile = {
      initial: "off",
      events: [{ timestamp: 1441, state: "on" }],
    };
    expect(() => calculateEnergyUsageSimple(usageProfile)).toThrow(
      INVALID_EVENT_TIMESTAMP_ERROR
    );
  });

  it("should throw an error for invalid event state", () => {
    const usageProfile = {
      initial: "on",
      events: [{ timestamp: 500, state: "invalid-state" }],
    };
    expect(() => calculateEnergyUsageSimple(usageProfile)).toThrow(
      getInvalidStateError(VALID_STATES_SIMPLE)
    );
  });

  it("should throw an error if profile is not an object", () => {
    // Test with various non-object types
    const invalidProfiles = [null, undefined, 123, "string", [], true];
    invalidProfiles.forEach((invalidProfile) => {
      expect(() => calculateEnergyUsageSimple(invalidProfile)).toThrow(
        INVALID_PROFILE_ERROR
      );
    });
  });
});

// Part 2

describe("calculateEnergySavings", () => {
  it("should return zero for always on", () => {
    const usageProfile = {
      initial: "on",
      events: [],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(0);
  });

  it("should calculate zero for always switch off manually", () => {
    const usageProfile = {
      initial: "off",
      events: [],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(0);
  });

  it("should calculate max period for always switched off automatically", () => {
    const usageProfile = {
      initial: "auto-off",
      events: [],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(MAX_IN_PERIOD);
  });

  it("should calculate energy savings correctly on sensible data", () => {
    const usageProfile = {
      initial: "off",
      events: [
        { state: "on", timestamp: 100 },
        { state: "off", timestamp: 150 },
        { state: "on", timestamp: 200 },
        { state: "auto-off", timestamp: 500 },
        { state: "on", timestamp: 933 },
        { state: "off", timestamp: 1010 },
        { state: "on", timestamp: 1250 },
        { state: "auto-off", timestamp: 1320 },
      ],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(
      933 - 500 + (MAX_IN_PERIOD - 1320)
    );
  });

  it("should calculate energy savings correctly on silly data (example 1)", () => {
    const usageProfile = {
      initial: "off",
      events: [
        { state: "on", timestamp: 100 },
        { state: "off", timestamp: 150 },
        { state: "on", timestamp: 200 },
        { state: "auto-off", timestamp: 500 },
        { state: "off", timestamp: 800 },
        { state: "on", timestamp: 933 },
        { state: "off", timestamp: 1010 },
        { state: "on", timestamp: 1250 },
        { state: "on", timestamp: 1299 },
        { state: "auto-off", timestamp: 1320 },
      ],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(
      933 - 500 + (MAX_IN_PERIOD - 1320)
    );
  });

  it("should calculate energy savings correctly on silly data (example 2)", () => {
    const usageProfile = {
      initial: "off",
      events: [
        { state: "on", timestamp: 250 },
        { state: "on", timestamp: 299 },
        { state: "auto-off", timestamp: 320 },
        { state: "off", timestamp: 500 },
      ],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(MAX_IN_PERIOD - 320);
  });

  it("should handle multiple consecutive auto-off events", () => {
    const usageProfile = {
      initial: "on",
      events: [
        { state: "auto-off", timestamp: 300 },
        { state: "auto-off", timestamp: 500 },
        { state: "on", timestamp: 600 },
      ],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(600 - 300);
  });

  it("should handle initial state as auto-off", () => {
    const usageProfile = {
      initial: "auto-off",
      events: [],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(MAX_IN_PERIOD);
  });

  it("should handle mixed on, off, and auto-off events close together", () => {
    const usageProfile = {
      initial: "off",
      events: [
        { state: "on", timestamp: 100 },
        { state: "auto-off", timestamp: 101 },
        { state: "off", timestamp: 102 },
        { state: "on", timestamp: 200 },
      ],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(200 - 101);
  });

  it("should handle last event as auto-off", () => {
    const usageProfile = {
      initial: "on",
      events: [{ state: "auto-off", timestamp: 1430 }],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(MAX_IN_PERIOD - 1430);
  });

  it("should handle manual off after auto-off", () => {
    const usageProfile = {
      initial: "on",
      events: [
        { state: "auto-off", timestamp: 300 },
        { state: "off", timestamp: 500 },
        { state: "on", timestamp: 600 },
      ],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(600 - 300);
  });

  it("should handle auto-off after off", () => {
    const usageProfile = {
      initial: "on",
      events: [
        { state: "off", timestamp: 300 },
        { state: "auto-off", timestamp: 500 },
        { state: "on", timestamp: 600 },
      ],
    };
    expect(calculateEnergySavings(usageProfile)).toEqual(0);
  });

  it("should throw an error for an invalid initial state", () => {
    const usageProfile11 = {
      initial: "invalid-state",
      events: [],
    };

    expect(() => calculateEnergySavings(usageProfile11)).toThrow(
      getInvalidStateError(VALID_STATES)
    );
  });

  it("should throw an error for negative or invalid timestamps", () => {
    const usageProfile12 = {
      initial: "off",
      events: [
        { timestamp: -10, state: "on" },
        { timestamp: 500, state: "off" },
      ],
    };

    expect(() => calculateEnergySavings(usageProfile12)).toThrow(
      INVALID_EVENT_TIMESTAMP_ERROR
    );
  });

  it("should throw an error for invalid initial state", () => {
    const usageProfile = {
      initial: "invalid-state",
      events: [],
    };
    expect(() => calculateEnergySavings(usageProfile)).toThrow(
      getInvalidStateError(VALID_STATES)
    );
  });
});

// Part 3
describe("calculateEnergyUsageForDay", () => {
  const monthProfile = {
    initial: "on",
    events: [
      { state: "off", timestamp: 500 },
      { state: "on", timestamp: 900 },
      { state: "off", timestamp: 1400 },
      { state: "on", timestamp: 1700 },
      { state: "off", timestamp: 1900 },
      { state: "on", timestamp: 2599 },
      { state: "off", timestamp: 2900 },
      { state: "on", timestamp: 3000 },
      { state: "off", timestamp: 3500 },
      { state: "on", timestamp: 4000 },
      { state: "off", timestamp: 4420 },
      { state: "on", timestamp: 4500 },
    ],
  };

  it("should calculate the energy usage for an empty set of events correctly", () => {
    expect(
      calculateEnergyUsageForDay({ initial: "off", events: [] }, 10)
    ).toEqual(0);
    expect(
      calculateEnergyUsageForDay({ initial: "on", events: [] }, 5)
    ).toEqual(MAX_IN_PERIOD);
  });

  it("should calculate day 1 correctly", () => {
    expect(calculateEnergyUsageForDay(monthProfile, 1)).toEqual(
      500 - 0 + (1400 - 900)
    );
  });

  it("should calculate day 2 correctly", () => {
    expect(calculateEnergyUsageForDay(monthProfile, 2)).toEqual(
      1900 - 1700 + (MAX_IN_PERIOD * 2 - 2599)
    );
  });

  it("should calculate day 3 correctly", () => {
    expect(calculateEnergyUsageForDay(monthProfile, 3)).toEqual(
      2900 - MAX_IN_PERIOD * 2 + (3500 - 3000) + (MAX_IN_PERIOD * 3 - 4000)
    );
  });

  it("should calculate day 4 correctly", () => {
    expect(calculateEnergyUsageForDay(monthProfile, 4)).toEqual(
      4420 - MAX_IN_PERIOD * 3 + (MAX_IN_PERIOD * 4 - 4500)
    );
  });

  it("should calculate day 5 correctly", () => {
    expect(calculateEnergyUsageForDay(monthProfile, 5)).toEqual(MAX_IN_PERIOD);
  });

  it("should calculate day 2 correctly when the first event starts on day 4", () => {
    const monthProfile1 = {
      initial: "off",
      events: [{ timestamp: 4500, state: "on" }],
    };
    expect(calculateEnergyUsageForDay(monthProfile1, 2)).toEqual(0);
    expect(calculateEnergyUsageForDay(monthProfile1, 4)).toEqual(1260);
    expect(calculateEnergyUsageForDay(monthProfile1, 15)).toEqual(
      MAX_IN_PERIOD
    );
  });

  it("should throw an error on an out of range day number", () => {
    expect(() => calculateEnergyUsageForDay(monthProfile, -5)).toThrow(
      /day out of range/
    );
    expect(() => calculateEnergyUsageForDay(monthProfile, 0)).toThrow(
      /day out of range/
    );
    expect(() => calculateEnergyUsageForDay(monthProfile, 366)).toThrow(
      /day out of range/
    );
  });

  it("should throw an error on a non-integer day number", () => {
    expect(() => calculateEnergyUsageForDay(monthProfile, 3.76)).toThrow(
      /must be an integer/
    );
  });

  it("should throw an error for an empty profile object", () => {
    expect(() => calculateEnergyUsageForDay({}, 1)).toThrow(
      INVALID_EVENTS_ERROR
    );
  });

  it("should handle no events before the specified day", () => {
    const monthProfile = { initial: "off", events: [] };
    expect(calculateEnergyUsageForDay(monthProfile, 5)).toEqual(0);
  });

  it("should handle no events on the specified day", () => {
    const monthProfile = {
      initial: "on",
      events: [
        { state: "off", timestamp: 1000 }, // Day 1
        { state: "on", timestamp: 2000 }, // Day 2
        { state: "off", timestamp: 5000 }, // After Day 3
      ],
    };
    expect(calculateEnergyUsageForDay(monthProfile, 3)).toEqual(MAX_IN_PERIOD);
  });

  it("should handle an event occurring at the exact start of the day", () => {
    const monthProfile = {
      initial: "on",
      events: [
        { state: "off", timestamp: MAX_IN_PERIOD * 2 }, // Day 3 start
        { state: "on", timestamp: 3000 },
      ],
    };
    expect(calculateEnergyUsageForDay(monthProfile, 3)).toEqual(
      MAX_IN_PERIOD * 3 - 3000
    );
  });

  it("should handle an event occurring at the exact end of the day", () => {
    const monthProfile = {
      initial: "on",
      events: [
        { state: "off", timestamp: 4319 }, // Last minute of Day 3
        { state: "on", timestamp: 5000 },
      ],
    };
    expect(calculateEnergyUsageForDay(monthProfile, 3)).toEqual(
      4319 - MAX_IN_PERIOD * 2
    );
  });

  it("should handle the first event of the month occurring after several days", () => {
    const monthProfile = {
      initial: "off",
      events: [
        { state: "on", timestamp: MAX_IN_PERIOD * 4 }, // Start of Day 5
      ],
    };
    expect(calculateEnergyUsageForDay(monthProfile, 1)).toEqual(0);
    expect(calculateEnergyUsageForDay(monthProfile, 4)).toEqual(0);
    expect(calculateEnergyUsageForDay(monthProfile, 5)).toEqual(MAX_IN_PERIOD);
  });

  it("should handle multiple events occurring in the same minute", () => {
    const monthProfile = {
      initial: "off",
      events: [
        { state: "on", timestamp: 1500 },
        { state: "off", timestamp: 1500 },
        { state: "on", timestamp: 2500 },
      ],
    };
    expect(calculateEnergyUsageForDay(monthProfile, 2)).toEqual(
      MAX_IN_PERIOD * 2 - 2500
    );
  });

  it("should handle all events in a single day", () => {
    const monthProfile = {
      initial: "off",
      events: [
        { state: "on", timestamp: MAX_IN_PERIOD }, // Day 2
        { state: "off", timestamp: 2000 },
        { state: "on", timestamp: 2500 },
      ],
    };
    expect(calculateEnergyUsageForDay(monthProfile, 2)).toEqual(
      2000 - MAX_IN_PERIOD + (MAX_IN_PERIOD * 2 - 2500)
    );
  });

  it("should handle events exactly at each day’s midnight", () => {
    const monthProfile = {
      initial: "on",
      events: [
        { state: "off", timestamp: MAX_IN_PERIOD }, // Start of Day 2
        { state: "on", timestamp: MAX_IN_PERIOD * 2 }, // Start of Day 3
        { state: "off", timestamp: MAX_IN_PERIOD * 3 }, // Start of Day 4
      ],
    };
    expect(calculateEnergyUsageForDay(monthProfile, 2)).toEqual(0);
    expect(calculateEnergyUsageForDay(monthProfile, 3)).toEqual(MAX_IN_PERIOD);
  });

  it("should handle continuous usage without any off events", () => {
    const monthProfile = {
      initial: "on",
      events: [],
    };
    expect(calculateEnergyUsageForDay(monthProfile, 1)).toEqual(MAX_IN_PERIOD);
    expect(calculateEnergyUsageForDay(monthProfile, 2)).toEqual(MAX_IN_PERIOD);
  });

  it("should handle random events scattered across the month", () => {
    const monthProfile = {
      initial: "off",
      events: [
        { state: "on", timestamp: 1300 }, // Day 1
        { state: "off", timestamp: 2500 }, // Day 2
        { state: "on", timestamp: 4000 }, // Day 3
        { state: "off", timestamp: 5000 }, // Day 4
        { state: "on", timestamp: 7000 }, // Day 5
        { state: "off", timestamp: 7500 }, // Day 5
      ],
    };
    expect(calculateEnergyUsageForDay(monthProfile, 1)).toEqual(
      MAX_IN_PERIOD - 1300
    );
    expect(calculateEnergyUsageForDay(monthProfile, 2)).toEqual(
      2500 - MAX_IN_PERIOD
    );
    expect(calculateEnergyUsageForDay(monthProfile, 3)).toEqual(
      MAX_IN_PERIOD * 3 - 4000
    );
  });
  it("should throw an error for invalid month profile input", () => {
    expect(() =>
      calculateEnergyUsageForDay({ initial: "invalid", events: [] }, 3)
    ).toThrow(getInvalidStateError(VALID_STATES_SIMPLE));

    expect(() => calculateEnergyUsageForDay({ initial: "on" }, 3)).toThrow(
      INVALID_EVENTS_ERROR
    );

    expect(() => calculateEnergyUsageForDay({ events: [] }, 3)).toThrow(
      getInvalidStateError(VALID_STATES_SIMPLE)
    );
  });
});
