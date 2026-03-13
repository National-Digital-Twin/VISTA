Feature: VISTA app

  Scenario: Initial page load shows correct display
    Given I open the project
    Then I can see the VISTA logo in the navigation bar
    And the Focus area panel is active
    And the map is loaded

  Scenario: Focus area view loads correctly
    Given I open the project
    When I open the Focus area panel
    Then I see the Focus area panel with its initial content

  Scenario: Assets view loads correctly
    Given I open the project
    When I open the Assets panel
    Then I see the Assets panel with its initial content

  Scenario: Exposure view loads correctly
    Given I open the project
    When I open the Exposure panel
    Then I see the Exposure panel with its initial content

  Scenario: Inspector view loads correctly
    Given I open the project
    When I open the Inspector panel
    Then I see the Inspector panel with its initial content

  Scenario: Utilities view loads correctly
    Given I open the project
    When I open the Utilities panel
    Then I see the Utilities panel with its initial content

  Scenario: Resources view loads correctly
    Given I open the project
    When I open the Resources panel
    Then I see the Resources panel with its initial content

  Scenario: Constraints view loads correctly
    Given I open the project
    When I open the Constraints panel
    Then I see the Constraints panel with its initial content

  Scenario: User menu shows profile and settings options
    Given I open the project
    When I open the user menu
    Then I can see My Profile in the menu
    And I can see Privacy notice in the menu
    And I can see Sign Out in the menu
