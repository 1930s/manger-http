-module(mob_app).
-behaviour(application).

-export([
  start/2,
  stop/1
]).

%% API
-export([go/1]).

start(_Type, _Args) ->
  {ok, Host} = application:get_env(mob, host),
  {ok, Port} = application:get_env(mob, port),
  {ok, ConcurrentConnections} = application:get_env(mob, connections),
  mob_sup:start_link({Host, Port, ConcurrentConnections}).

go(StreamFun) ->
  mob_sup:go(StreamFun).

stop(_State) ->
	ok.
