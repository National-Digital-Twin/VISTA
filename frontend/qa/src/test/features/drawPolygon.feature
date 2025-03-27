Feature: Draw a polygon functionality

 Scenario: User is able to draw a polygon on the paralog map
    Given I login to the ndtp app with the user credentials
    And   I click the Paralog menu
    When  I draw a polygon
    Then  I should be able to verify a polygon is drawn successfully
