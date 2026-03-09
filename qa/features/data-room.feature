Feature: Data room

  Scenario: Data room opens with initial layout and features
    Given I open the project
    When I navigate to the Data room
    Then I see the Data room sidebar with scenario management
    And I see the Data room sidebar with data sources section
    And I see the Data sources main content with search and table

  Scenario: Data room data sources view shows expected columns
    Given I open the project
    When I navigate to the Data room
    Then I see the data sources table with columns Data source, Owner, and Access level
