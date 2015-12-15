# nearby-tweets
Single page application that shows the most recent tweets posted in the city of the logged visitor and allows to share a video link with the configured hashtag. 

REQUIREMENTS
---------------
 * OAuth authorization token for a Twitter Application where the public and private keys are bound. To be configured to use the application.
 * Twitter account to login and use the application.

# FRAMEWORKS AND TOOLS USED
---------------
 * AngularJS: Technology specially designed for single page applications that simplifies the development and is wide spread.
 * Bootstrap CSS: Styles and scripts with good look and feel that ease UX development and simplifies code.
 * ngInfiniteScroll: Directive for AngularJS directive with no restriction of equivalent sizes of the elements loaded and rendered at the scroll event.
 * Twitter widgets script: Scrip for rendering the widgets returned by the Twitter API as recommended.
 * OAuth: Standard and secure authorization connector for exchanging information with the Twitter API.
 * Twitter API: Interface to exchange information with Twitter.

# FEATURES:
* Log in and log out with a Twitter account.
* Search tweets with videos in the city you are currently at. With configured:
    * hashtag, number of tweets per request
    * minutes to request for new tweets
    * content of the tweets (like: youtube)
* Show latest tweets at the top of the of the list periodically
* Load older tweets at the bottom of the page when scroll down 
* Retweet, mark as favorite
* Submit a post with location (geo, place and coordinates)
* Filter the tweets shown with keywords

# GET STARTED
---------------
* At the twitter.services.js file, set the OAUTH_KEY which bounds the Twitter Application’s keys.
* Run the application and access through the index.html page.
* Log in with your twitter account.
* Scroll down to find older tweets.
* Post a video and a comment and wait for the periodic refresh.
* If you want to search another hashtag, at the main.controller file, change the value of the property: mc.twitterReqParameters. hashtag. Don’t include the symbol #.

# ISSUES:
---------------
* The search nearby is defined as a search by city. It requires each tweet has being posted with geo, coordinates and place information. Otherwise, it won't be considered.
"geo": null, "coordinates": null.
* Retweets are rendered by Twitter with the original tweet information, so a retweet may seem repeated when it is not.
* In case the visitor is not located the application will search the latest tweets without checking the place.
