#!groovy

node('EJ2Angularsbnode18') {
    try {
        deleteDir()        

        stage('Import') {
            git url: 'https://gitea.syncfusion.com/essential-studio/ej2-groovy-scripts.git', branch: 'master', credentialsId: env.GiteaCredentialID;
            shared = load 'src/shared.groovy'
        }

        stage('Checkout') {
              checkout scm
            // shared.getProjectDetails()
            // shared.gitlabCommitStatus('running')
        }

        stage('Install') {
            sh 'npm i'
        }

        stage('Build') {
            sh 'npm run doc-build'
        }

        stage('Publish') {
           if(shared.isProtectedBranch()){
              sh 'npm run ci-publish'     
           }
        }

        deleteDir()
    }
    catch(Exception e) {
        shared.throwError(e)
        deleteDir()        
    }
}
