# CI/CD

The repository includes two GitHub Actions workflows:

- `.github/workflows/ci.yml`: CI quality gates for pushes and pull requests.
- `.github/workflows/aws-eb-deploy.yml`: CD deployment to AWS Elastic Beanstalk after quality gates pass.

## What The Pipeline Checks

```text
checkout
setup Node.js 20
npm install --package-lock=false
npm run check:env
npm run check:architecture
npm test
```

## AWS Elastic Beanstalk CD

The CD workflow runs on:

- Pushes to `main`.
- Manual runs from the GitHub Actions tab using `workflow_dispatch`.

It performs:

```text
checkout
setup Node.js 20
npm install --package-lock=false
npm run ci
git archive deployment bundle
upload bundle to S3
create Elastic Beanstalk application version
update Elastic Beanstalk environment
wait for environment update
```

Required GitHub repository secrets:

| Secret | Example / note |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM access key for deployment |
| `AWS_SECRET_ACCESS_KEY` | IAM secret access key for deployment |
| `AWS_REGION` | `ap-southeast-2` for Sydney |
| `AWS_EB_APPLICATION_NAME` | Elastic Beanstalk application name, for example `snevo` |
| `AWS_EB_ENVIRONMENT_NAME` | Elastic Beanstalk environment name, for example `Snevo-env` |
| `AWS_EB_BUCKET` | S3 bucket used for EB versions, often `elasticbeanstalk-<region>-<account-id>` |

The deployment bundle is created with `git archive`, so ignored local files such as `local.env`, `.env`, and `node_modules/` are not uploaded.

## Why This Counts

- The pipeline runs automatically on pushes and pull requests.
- It blocks tracked env files and common leaked-token patterns.
- It enforces the layered architecture rules with a repeatable script.
- It runs the repository and service contract tests.
- It can deploy the tested commit to a real AWS Elastic Beanstalk environment.

## Local Equivalent

Run the same checks locally:

```powershell
npm run ci
```

## Evidence For Report

- Screenshot of GitHub Actions workflow passing.
- Screenshot of the AWS deploy workflow showing the deploy job completed.
- Screenshot of the command `npm run ci` passing locally.
- Short explanation that CI runs quality gates and CD promotes the same tested commit to AWS Elastic Beanstalk.
