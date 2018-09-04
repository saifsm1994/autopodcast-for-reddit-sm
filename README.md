# autopodcast-for-reddit-sm


This is a node.js app which allows users to scrape a chosen Subreddit for posts and articles and then produce a audio file

It consists of three text scraping APIS which:

1. Fetch post titles and URLs to articles/posts
2. Fetch and summarize article/posts using Lexrank text summarization
3. Applies a basic template to the fetched information

It also includes two services which call upon the google cloud (Wavenet voice) text to speech API to turn the information provided by the aforementioned APIs into a mp3.
These are respectively:

1. Short: This service only calls for post titles and produces a mp3 file of these. This is desirable as the nature of Reddit posts often means few people open the full article
2. Complete: This service calls for post titles & a 7 sentence summary of the post and produces a separate labeled mp3 file for each post.

Warning: This service relies upon google cloud APIs and will not function without google cloud credentials being set up on your server.
