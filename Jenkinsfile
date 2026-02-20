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
                echo 'Cloning repository...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running tests...'
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                echo 'Building application...'
                sh 'npm run build || echo "No build script found"'
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
