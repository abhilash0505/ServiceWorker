$(function() {
	$(function(){
		var url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/1024px-Pleiades_large.jpg';
		for(var i=0; i < 100; i++){
				$('body').append('<img src="'+url+'?rand='+i+'"/>');
		}
	});
});

if(navigator.serviceWorker) {
	navigator
		.serviceWorker
		.register('sw.js')
		.then(function(r) {
			console.log('Cats are now available offline');
		})
		.catch(function(e) {
			console.log('Cats are NOT available offline');
			console.log(e);
		});
} else {
	console.log('Service workers are not supported');
}