/**
 * Factory for notifying a feedback message. Injected in the 'nearbyTweetsApp.services' module.
 * @param Service name
 * @param Factory function
 */
servicesModule.factory('messageService', function($rootScope) {
    var messageService = {};
    
    /*-----------------------------------------------
     * COMMON PREDEFINED MESSAGES
     *-----------------------------------------------
     */            
    messageService.ERR_CHECK_CONNECTION_CREDENTIALS = "It seems we are not connected to Twitter. Sing in or verify authorization token.";
    messageService.ERR_CHECK_AUTHORIZATION_CREDENTIALS = "You can't connect to Twitter, verify the authorization token in the application.";
    messageService.OK_TWEET_POSTED = 'Your post has being shared for inspiring others. Thanks!';    
    messageService.WARN_NOT_RECENT_TWEETS = 'There are no recent tweets. Share a video or wait inspiration from others.'; 
    messageService.message = '';
   
    /*-----------------------------------------------
     * FUNCTIONS
     *-----------------------------------------------
     */
        
   /**
    * Sets the message of the given type and triggers the corresponding event to the $rootScope
    * @param {String} message Message to set
    * @param {String} type Type could be (success|error|warning)
    */
    messageService.setMessage = function(message, type) {
        messageService.type = type;
        if(type === 'success')
        {
            messageService.message = message;
            messageService.notifySuccessFeedback ();
        }
        else if (type === 'error')
        {
             messageService.message = message;
             messageService.notifyErrorFeedback ();
        }
        else if (type === 'warning')
        {
            messageService.message = message;
            messageService.notifyWarningFeedback ();
        }
        //Trigger a timeout to hide the message
        $rootScope.$broadcast('handleFeedbackTimer');
    };

    /**
     * Broadcast a success message triggering the event: handleSuccessFeedback     
     */
    messageService.notifySuccessFeedback = function() {
        $rootScope.$broadcast('handleSuccessFeedback' );
    };
    
    /**
     * Broadcast a warning message triggering the event: handleWarningFeedback     
     */
    messageService.notifyWarningFeedback = function() {
        $rootScope.$broadcast('handleWarningFeedback' );
    };
    
    /**
     * Broadcast an error message triggering the event: handleErrorFeedback     
     */
    messageService.notifyErrorFeedback = function() {
        $rootScope.$broadcast('handleErrorFeedback' );
    };
    
    /**
     * Resets the message to an empty one
     */
    messageService.resetMessage = function (){
        messageService.message = '';
    };
    return messageService;
});