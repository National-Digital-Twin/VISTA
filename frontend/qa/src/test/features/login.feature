Feature: Vista login functionality

@inprogress
 Scenario: Verify user is able to land on paralog page successfully
    Given I login to the ndtp app with the user credentials
    When I click the Vista menu
    Then I should see the asset details and layers tab
