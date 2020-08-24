# auto_puncher

deploy command: 

gcloud functions deploy auto_puncher --region=asia-south1 
  --runtime nodejs10 --trigger-topic <topic_name> --entry-point <function_name>
  --allow-unauthenticated --env-vars-file env.yaml
  
