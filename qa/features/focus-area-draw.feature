Feature: Focus area draw and delete

  Scenario: Draw a polygon and delete it
    Given I open the project
    When I open the Focus area panel
    And the Focus area panel is ready for drawing
    And the map is loaded
    When I draw a new polygon on the map
    Then a new focus area appears in the list
    When I delete the most recently added focus area
    Then that focus area is no longer in the list
