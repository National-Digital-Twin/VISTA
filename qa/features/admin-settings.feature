Feature: Admin settings

  Scenario: Admin settings page opens with initial layout and tabs
    Given I open the project
    When I open the user menu
    And I open Admin settings from the menu
    Then I see the Admin settings page heading
    And I see the admin settings tabs

  Scenario: Admin settings shows Users, Invites, Groups and Access requests tabs
    Given I open the project
    When I open the user menu
    And I open Admin settings from the menu
    Then I see the tab Users
    And I see the tab Invites
    And I see the tab Groups
    And I see the tab Access requests

  Scenario: Admin settings Users tab shows initial content
    Given I open the project
    When I open the user menu
    And I open Admin settings from the menu
    Then the Users tab is selected
    And I see the Users tab content with search and table
