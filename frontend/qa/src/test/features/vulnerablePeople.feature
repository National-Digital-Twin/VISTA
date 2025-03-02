Feature: Draw a vulnerable people area functionality

 Scenario: User is able to draw a vulnerable people area on the paralog map
    Given I login to the ndtp app with the user credentials
    When  I click the Paralog menu
    And   I draw a vulnerable people area and click a vulnerable person
    Then  I can see the details of the vulnerable person displayed
