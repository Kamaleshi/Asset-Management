pipeline {
    agent any

    tools {
        nodejs "NodeJS"   // Name must match Jenkins NodeJS tool config
    }

    environment {
        CI = "true"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Run Backend Server Test') {
            steps {
                dir('backend') {
                    sh 'node server.js & sleep 5'
                }
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully 🚀'
        }
        failure {
            echo 'Build failed ❌'
        }
    }
}
