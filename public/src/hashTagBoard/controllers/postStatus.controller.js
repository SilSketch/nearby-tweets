/**
 * Post Controller
 * Name: PostStatusController
 */
app.controller('PostStatusController', function($scope, $rootScope, twitterService, messageService) {
    /*-----------------------------------------------
     * CONTROLLER ATTRIBUTES
     *-----------------------------------------------
     */

    var t_model = this;
    t_model.videoURL_hint = "Video URL (e.g.youtube.com/)";
    t_model.hashTag = $scope.appHashTag;
    t_model.comment_hint = "Comment";
    t_model.state = -1;
    t_model.appCommentMaxLength = 140 - $scope.appHashTag.length;
    t_model.new = {};
    t_model.setDefaultData = function() {
        t_model.videoURL = '';
        t_model.comment = '';
    };

    /*-----------------------------------------------
     * FUNCTIONS TO POST AND SYNC VIEW DATA
     *-----------------------------------------------
     */

    /**
     * Posts the status (comment, hashtag and video URL) in the timeline of the logged user
     * @post: Set the status feedback message corresponding to the situation     
     */
    t_model.postStatusTweet = function() {
        twitterService.postStatusTweet(t_model.hashTag, t_model.videoURL, t_model.comment)
            .then(function(data) {
                messageService.setMessage(messageService.OK_TWEET_POSTED, 'success');
                $scope.tweetForm.$setPristine(true);
                t_model.setDefaultData();
                var delay = 45000;
                setTimeout(function() {
                    $rootScope.$broadcast('refreshLatestTweets');
                }, delay);
            }, function(error) {
                messageService.setMessage(messageService.ERR_CHECK_CONNECTION_CREDENTIALS, 'error');
                return;
            });
    };

    /**
     * Updates the maximum length of the comment depending on the length of the URL. Used for validation.
     */
    t_model.videoURLChanged = function() {
        if (t_model.videoURL)
            t_model.appCommentMaxLength = 140 - $scope.appHashTag.length - t_model.videoURL.length;
        if (t_model.appCommentMaxLength < 0)
            t_model.appCommentMaxLength = 0;
    };

});