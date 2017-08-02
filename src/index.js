function vkApi(method, options) {
    if (!options.v) {
        options.v = '5.64';
    }

    return new Promise((resolve, reject) => {
        VK.api(method, options, data => {
            if (data.error) {
                reject(new Error(data.error.error_msg));
            } else {
                resolve(data.response);
            }
        });

    });
}

function vkInit() {
    return new Promise((resolve, reject) => {
        VK.init({
            apiId: 6058497
        });

        VK.Auth.login(data => {
            if (data.session) {
                resolve();
            } else {
                reject(new Error('Не удалось авторизоваться'));
            }
        }, 2);
    });
}

var template = `
{{#each items}}
    <div id="friendMove" class="friend" data-id="{{id}}">
        <div class="friend__container" >
            <img src="{{photo_200}}">
            <div class="name">{{first_name}} {{last_name}}</div>
            <button id="addFriendButton"><i id="iButton" class="fa fa-plus" aria-hidden="true"></i></button> 
        </div>    
    </div>
{{/each}}
`;
var templateFn = Handlebars.compile(template);

new Promise(resolve => window.onload = resolve)
    .then(() => vkInit())
    .then(() => vkApi('users.get', {name_case: 'gen'}))
    .then(response => {
        headerInfo.textContent = 'Выберите друзей';
    })
    .then(() => vkApi('friends.get', {fields: 'photo_200', order: 'name'}))

    .then(response => {

        var dataFriend = parseHandler();
        friends__list_left.innerHTML = templateFn({items: dataFriend.left});
        friends__list_right.innerHTML = templateFn({items: dataFriend.right});


        function serialHandler(){
            var storage = localStorage;
            var friendsListRight = document.getElementById('friends__list_right');
            var friendLoadList = [];
            for (var i = 0; i < friendsListRight.children.length; i++){
                friendLoadList.push(friendsListRight.children[i].dataset.id);
            }
            var serialObj = JSON.stringify(friendLoadList);
            storage.setItem('data', serialObj);


        }

        function parseHandler() {
            var storage = localStorage;
            var friendLeft = [];
            var friendRight = [];
            if (storage) {
                var data = storage.getItem('data');
                var friendLoadList = [];
                if (typeof data !== 'undefined') {
                    friendLoadList = JSON.parse(storage.getItem('data'));
                }

                    for (var j = 0; j < response.items.length; j++) {
                        if (friendLoadList.indexOf(response.items[j].id.toString()) > -1){
                            friendRight.push(response.items[j])
                        }else {
                            friendLeft.push(response.items[j])
                        }
                    }
                        return {left: friendLeft, right: friendRight}
            }
        }


        var saveButton = document.getElementById('saveButton');
        saveButton.addEventListener('click', serialHandler);

        var friendsListLeft = document.getElementById('friends__list_left');
        var friendsListRight = document.getElementById('friends__list_right');
        friendsListLeft.addEventListener('click', handler1);
        friendsListRight.addEventListener('click', handler2);
        var inputLeft = document.querySelector('.friends__input_left');
        inputLeft.addEventListener('keyup', function(){
            var value = this.value;
            if (value.length > 0){

                    var someFriend = friendsListLeft.getElementsByClassName('friend');

                    for (var i = 0; i < someFriend.length; i++){
                        var name = someFriend[i].querySelector('.name').innerHTML;

                        if (isMatching(name, value)){
                            someFriend[i].style.display = 'block';
                        } else{
                            someFriend[i].style.display = 'none';
                        }
                        }

                    } else{
                var someFriend = friendsListLeft.getElementsByClassName('friend');
                for (var i = 0; i < someFriend.length; i++){
                    someFriend[i].style.display = 'block';
                }
            }


        });

        function isMatching(full, chunk) {

            full = full.toLowerCase();
            chunk = chunk.toLowerCase();
            if (full.indexOf(chunk) > -1) {
                return true;
            }
            return false;

        }
        var DragManager = new function() {


            var dragObject = {};
            var self = this;

            document.onmousedown = function (e) {
                if (e.which != 1) {
                    return;
                }
                var elem = e.target.closest('.friend');

                if (!elem) return;

                dragObject.elem = elem;

                dragObject.downX = e.pageX;
                dragObject.downY = e.pageY;

                return false;
            }

            document.onmousemove = function (e) {

                if (!dragObject.elem) return;

                if (!dragObject.avatar) {
                    var moveX = e.pageX - dragObject.downX;
                    var moveY = e.pageY - dragObject.downY;

                    if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) {
                        return;
                    }

                    dragObject.avatar = createAvatar(e);
                    if (!dragObject.avatar) {
                        dragObject = {};
                        return;
                    }

                    var coords = getCoords(dragObject.avatar);
                    dragObject.shiftX = dragObject.downX - coords.left;
                    dragObject.shiftY = dragObject.downY - coords.top;

                    startDrag(e);
                }

                dragObject.avatar.style.left = e.pageX - dragObject.shiftX + 'px';
                dragObject.avatar.style.top = e.pageY - dragObject.shiftY + 'px';

                return false;
            }

            document.onmouseup = function(e) {
                if (dragObject.avatar) {
                    finishDrag(e);
                }

                dragObject = {};
            }

            function finishDrag(e) {
                var dropElem = findDroppable(e);

                if (!dropElem) {
                    self.onDragCancel(dragObject);
                } else {
                    self.onDragEnd(dragObject, dropElem);
                }
            }

            function createAvatar(e) {


                var avatar = dragObject.elem;

                var old = {
                    parent: avatar.parentNode,
                    nextSibling: avatar.nextSibling,
                    position: avatar.position || '',
                    left: avatar.left || '',
                    top: avatar.top || '',
                    zIndex: avatar.zIndex || ''
                };


                avatar.rollback = function () {
                    old.parent.insertBefore(avatar, old.nextSibling);
                    avatar.style.position = old.position;
                    avatar.style.left = old.left;
                    avatar.style.top = old.top;
                    avatar.style.zIndex = old.zIndex
                };

                return avatar;

            }

            function startDrag(e) {
                var avatar = dragObject.avatar;
                document.body.appendChild(avatar);
                avatar.style.zIndex = 9999;
                avatar.style.position = 'absolute';
            }

            function findDroppable(event) {

                dragObject.avatar.hidden = true;
                var elem = document.elementFromPoint(event.clientX, event.clientY);
                dragObject.avatar.hidden = false;

                if (elem == null) {

                    return null;
                }

                return elem.closest('#friends__list_right');
            }

            this.onDragEnd = function (dragObject, dropElem) {

                dropElem.appendChild(dragObject.elem);
                dragObject.elem.style.position = 'inherit';
                var iButton = e.target.firstChild;
                iButton.classList.toggle('fa-minus');

            };
            this.onDragCancel = function (dragObject) {
            };

            function getCoords(elem) { // кроме IE8-
                var box = elem.getBoundingClientRect();

                return {
                    top: box.top + pageYOffset,
                    left: box.left + pageXOffset
                };

            }

        };
        DragManager.onDragCancel = function(dragObject) {
            dragObject.avatar.rollback();
        };
    })
    .catch(e => alert('Ошибка: ' + e.message));

function handler1(e){

    var friendsListLeft = document.getElementById('friends__list_left');
    var friendsListRight = document.getElementById('friends__list_right');
    if (e.target.tagName == 'BUTTON') {
        var someFriendLeft = e.target.parentNode;
        //var iButton = document.getElementById('iButton');
        var iButton = e.target.firstChild;
        friendsListLeft.removeChild(someFriendLeft.parentElement);
        friendsListRight.appendChild(someFriendLeft.parentElement);
        iButton.classList.toggle('fa-minus');
    }

}

function handler2(e) {
    if (e.target.tagName == 'BUTTON') {
        var someFriendLeft = e.target.parentNode;
        var friendsListLeft = document.getElementById('friends__list_left');
        var friendsListRight = document.getElementById('friends__list_right');
        var iButton = e.target.firstChild;
        friendsListLeft.appendChild(someFriendLeft.parentElement);
        friendsListRight.removeChild(someFriendLeft.parentNode);
        iButton.classList.toggle('fa-plus');
    }
}












