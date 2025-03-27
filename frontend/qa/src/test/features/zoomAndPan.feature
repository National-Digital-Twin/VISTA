Feature: Zoom and pan functionality on paralog

Background:
    Given I login to the ndtp app with the user credentials
    And   I click the Paralog menu

   Scenario: Verify user can zoom in and out on the paralog map using zoom button
      When I zoom in and out using the zoom button
      Then I am zoomed in and out

  Scenario: Verify user can zoom in and out on the paralog map
      When I zoom in and out on the map using the mouse wheel
      Then I should be able to zoom in and out

  Scenario: Verify user can pan around on the paralog map
      When I am on the map
      Then I should be able to pan around the map
