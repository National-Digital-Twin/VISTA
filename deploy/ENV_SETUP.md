## Creating a new environment
The current setup has two branches: staging and production. We can create another feature or dev branch if needed.
The following steps detail the process of creating a new environment.
1. Creating an SSL certificate.
   1. Navigate to ACM on AWS console ([link](https://eu-west-2.console.aws.amazon.com/acm/home?region=eu-west-2#/certificates/list) for eu-west-2)
   2. Click the "Request" button to "Request a certificate."
   3. Keep the default "Request a public certificate" selection and click the Next button.
   4. Provide a Fully qualified domain name (FWDN). It can be like 'dev.paralog.coefficient.dev' or 'devparalog.coefficient.dev' or 'blue.paralog.coefficient.dev'. We will pick 'dev.paralog.coefficient.dev' for this example.
   5. Keep "Validation method" as "DNS validation" and "Key algorithm" as "RSA 2048". Add "Tags" as needed, and click on the "Request" button.
   6. You should now have a certificate titled "Pending validation".
   7. Under the section called "Domains", you will also see "CNAME name" and "CNAME value" with the domain name. We will need them in the next step.
   8. Log in to https://my.101domain.com and navigate to "View All Domains" -> "coefficient.dev" -> "Manage DNS Records"
   9. Create a "New Record" with the following values:
       1. "Subdomain": Sub-domain from "CNAME Name" from the previous step in the console. For example if "CNAME Name"=`_e29557a377b5365e5e7e2662d0175748.dev.paralog.coefficient.dev.` you will need to put `_e29557a377b5365e5e7e2662d0175748.dev.paralog`
       2. Set TTL: 300 seconds or 5 minutes
       3. Record type: CNAME
       4. Set VALUE as "CNAME value" from the AWS console (in the previous step).
       5. Click 'Add' to create a record.
   10. Now, if you return to the AWS Console page for the certificate after 5-10 minutes, you should see the Certificate status as "Issued."
2. Code changes
    1. Next, create a new branch of `develop` (say `dev-deployment`) and add a new file to `.github/workflows/.` This file should be similar to `cd-staging.yml`, but 'staging' should be replaced with 'dev'.
    2. Ensure that `branches` include only the current new branch name.
    3. So the file should look like this:
        ```yaml
        name: Paralog continuous deployment dev

        on:
          push:
            branches:
              - dev-deployment
          workflow_dispatch:

        concurrency:
          group: dev_environment
          cancel-in-progress: true

        jobs:
          deploy:
            uses: ./.github/workflows/cd-template.yml
            with:
              environment: "dev"
            secrets:
            ...
            <ADD SECRETS>
            ...
        ```
    4. Commit changes and push to trigger CI/CD for the new environment.

        ---
        **_NOTE:_**
        - You might have to restart the workflow failing steps a few times as certain dependencies are not correctly resolved in the OpenTofu configuration.
        - CD can take a while to create databases and EKS clusters and nodes.
        ---
3. API GW changes.
    1. Navigate to AWS API GW in AWS Console ([link](https://eu-west-2.console.aws.amazon.com/apigateway/main/apis?api=unselected&region=eu-west-2) for eu-west-2).
    2. Once deployment is over, you should see a new API Gateway called `dev-main` or whatever the new envname you have picked. `<ENV>-main`.
    3. Click "Custom domain names" on the left sidebar.
    4. Click on the "Create" button.
    5. Add domain name. For this example, it `dev.paralog.coefficient.dev`
    6. Under "Endpoint configuration", select the newly created "ACM certificate" from the dropdown.
    7. Leave the rest of the options as is, add tags if necessary, and click on the "Create domain name" button.
    8. On the next page, you should see "Endpoint configuration" for this Custom Domain name. Keep note of "API Gateway domain name". You will need it in the next few steps.
    9. Click on the "API mappings" tab.
    10. On the next page, click the "Configure API mappings" and "Add new mappings" buttons.
    11. Select the newly created API, its default stage, and keep Path empty.
    12. Click on the "Save" button to save the mapping.
4. Configure DNS
    1. Navigate to the "DNS Records" page at https://my.101domain.com and create a new record with the following:
        1. "NAME": "dev.paralog"
        2. "TTL": "5 Minutes"
        3. "TYPE": "CNAME"
        4. "VALUE": "Endpoint configuration" -> "API Gateway domain name" from the "Custom domain names" creating page in the AWS Console.
5. Configuring EKS cluster for debugging:
    1. Navigate to the newly created EKS CLuster in AWS Console ([link](https://eu-west-2.console.aws.amazon.com/eks/home?region=eu-west-2#/clusters)).
    2. Select the cluster with the name of env 'paralog-dev' in our case.
    3. Click on the the "Access" tab. Under the section for "IAM access entries", you will need to create an entry for each user who needs access to query the cluster.
    4. To do this, click "Create access entry" and type the IAM user name in "IAM principal ARN" to select the IAM User from the dropdown popup.
    5. Add tags if needed, keep the rest as is, and click "Next".
    6. Select "AmazonEKSClusterAdminPolicy", a policy on the next page, and click on the "Add policy" button.
    7. Click "Next" to the "Review and Create" confirmation page.
    8. Click "Create" to finish it off.
    9. Assuming that your AWS CLI is already configured locally. Running the following command will load the load Kubernetes config
       `aws eks update-kubeconfig --region eu-west-2 --name paralog-staging`
   10. Finally, you can work on `kubectl` or `k9s` to query the cluster.
