Feature: Draw a vunerable people area functionality

 Scenario: User is able to draw a vunerable people area on the paralog map
    Given I login to the ndtp app with the user credentials
    When  I click the Paralog menu
    And   I draw a vunerable people area and click a vunerable person
    Then  I can see the details of the vunerable person displayed
