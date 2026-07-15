# Future Enhancements & To-Do List

## Automated Testing & Validation Pipeline
To ensure mathematical accuracy and prevent regressions, the current `verify_calculations.js` script should be expanded into a robust, automated test suite.

### 1. Implement Assertions
- Replace basic `console.log` statements in `verify_calculations.js` with Node's native `assert` module (e.g., `assert.strictEqual(actual, expected)`).
- Ensure the script throws a fatal error and exits with a non-zero status code if any mathematical calculation fails.

### 2. Expand Test Coverage
- Add test cases for all completed engines, specifically targeting the newest additions:
  - `testDynamicLoads()`: Validate impact factors and natural frequencies.
  - `testShellsOfRevolution()`: Validate membrane stresses for spherical, cylindrical, and conical shells.
  - `testCurvedBeams()`: Validate Winkler-Bach neutral axis shifts and extreme fiber stresses.
- Source all "expected" baseline values directly from the tables in *Roark's Formulas for Stress and Strain (8th Ed)*.

### 3. Continuous Integration (CI)
- Integrate the expanded `verify_calculations.js` script into a GitHub Actions workflow.
- Configure the workflow to automatically run `node verify_calculations.js` on every pull request or push to the `master` branch.
- Block merging if the mathematical validation pipeline fails.
