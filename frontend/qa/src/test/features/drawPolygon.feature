Feature: Draw a polygon functionality

 Scenario: User is able to draw a polygon on the paralog map
    Given I login to the ndtp app with the user credentials
    When  I click the Paralog menu
    Then  I should be able to draw a polygon successfully

  Scenario: Verify user can zoom in and out on the paralog map
    Given I login to the ndtp app with the user credentials
    When  I click the Paralog menu
    Then  I should see the asset details tab
