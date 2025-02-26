Feature: Draw a vunerable people area functionality

 Scenario: User is able to draw a vunerable people area on the paralog map
    Given I login to the ndtp app with the user credentials
    When  I click the Paralog menu
    And   I draw a vunerable people area and click a vunerable person
    Then  The details of the vunerable person is displayed
