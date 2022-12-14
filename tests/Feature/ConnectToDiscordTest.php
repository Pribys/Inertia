<?php

namespace Tests\Feature;

use App\Events\DiscordConnectionUpdated;
use App\Models\DiscordUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Redirect;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use SocialiteProviders\Manager\OAuth2\User as OAuthUser;
use Tests\TestCase;

class ConnectToDiscordTest extends TestCase
{
    use RefreshDatabase;

    protected function mockSocialiteResponse(): void
    {
        Socialite::shouldReceive('driver->setScopes->redirect')->andReturn(Redirect::to('/connections/discord/authorize/callback?code=123&state=456'));
        Socialite::shouldReceive('driver->user')->andReturn((new OAuthUser())
            ->setAccessTokenResponseBody([
                'access_token' => 'INVALIDxq3Ly5ca88vy9aUKjLIXdqr',
                'expires_in' => 604800,
                'refresh_token' => 'INVALIDb8yS0e3Iau0Pn6Q96yUHr9T',
                'scope' => 'identify connections',
                'token_type' => 'Bearer',
            ])
            ->setToken('INVALIDxq3Ly5ca88vy9aUKjLIXdqr')
            ->setRefreshToken('INVALIDb8yS0e3Iau0Pn6Q96yUHr9T')
            ->setExpiresIn(604800)
            ->setRaw([
                'id' => '696628666183975013',
                'username' => 'Claudio Dekker',
                'avatar' => '32fc945e99042ce4fc6117347cb9b5b7',
                'discriminator' => '3220',
                'public_flags' => 0,
                'flags' => 0,
                'locale' => 'en-GB',
                'mfa_enabled' => true,
            ])
            ->map([
                'id' => '696628666183975013',
                'nickname' => 'Claudio Dekker#3220',
                'name' => 'Claudio Dekker',
                'email' => null,
                'avatar' => 'https://cdn.discordapp.com/avatars/696628666183975013/32fc945e99042ce4fc6117347cb9b5b7.jpg',
            ]));
    }

    /** @test */
    public function users_are_redirected_to_discord_to_authorize_the_connection(): void
    {
        $this->mockSocialiteResponse();

        $response = $this->actingAs(User::factory()->create())
            ->get('/connections/discord/authorize');

        $response->assertRedirect('/connections/discord/authorize/callback?code=123&state=456');
    }

    /** @test */
    public function guests_are_redirected_to_the_github_authorization_page(): void
    {
        $response = $this->get('/connections/discord/authorize');

        $response->assertRedirect('/auth/github');
    }

    /** @test */
    public function users_can_connect_their_discord_account_by_authorizing_the_connection(): void
    {
        Event::fake(DiscordConnectionUpdated::class);
        $this->mockSocialiteResponse();
        $user = User::factory()->withGithub()->create();

        $this->actingAs($user)
            ->get('/connections/discord/authorize/callback?code=123&state=456')
            ->assertRedirect('https://discord.com/channels/592327939920494592/592327939920494594');

        tap($user->discordUser, function (DiscordUser $discordUser) {
            $this->assertSame(696628666183975013, $discordUser->discord_api_id);
            $this->assertSame('Claudio Dekker#3220', $discordUser->discord_api_nickname);
            $this->assertSame('INVALIDxq3Ly5ca88vy9aUKjLIXdqr', $discordUser->discord_api_access_token);
            $this->assertSame('INVALIDb8yS0e3Iau0Pn6Q96yUHr9T', $discordUser->discord_api_refresh_token);
            Event::assertDispatched(DiscordConnectionUpdated::class, fn ($event) => $event->discordUser->is($discordUser));
        });
    }

    /** @test */
    public function it_redirects_back_to_discord_when_the_authorization_callback_was_invalid(): void
    {
        Socialite::shouldReceive('driver->user')->andThrow(InvalidStateException::class);
        $user = User::factory()->withGithub()->create();

        $this->actingAs($user)
            ->get('/connections/discord/authorize/callback?code=123&state=456')
            ->assertRedirect('/connections/discord/authorize');

        $this->assertNull($user->discordUser);
    }

    /** @test */
    public function it_aborts_when_the_authorization_was_cancelled(): void
    {
        $user = User::factory()->withGithub()->create();

        $response = $this->actingAs($user)
            ->get('/connections/discord/authorize/callback?error=access_denied&error_description=The+resource+owner+or+authorization+server+denied+the+request&state=aEWGKJ2NLTPCkON29kykkE6Yvz8x65j24oOEn0YO');

        $response->assertStatus(428);
    }

    /** @test */
    public function it_removes_the_existing_discord_connection_when_connecting_it_to_a_different_user(): void
    {
        Event::fake(DiscordConnectionUpdated::class);
        $this->mockSocialiteResponse();
        $existingUser = User::factory()->withGithub()->withDiscord()->create(['github_api_id' => '1234']);
        $newUser = User::factory()->withGithub()->create();

        $this->actingAs($newUser)
            ->get('/connections/discord/authorize/callback?code=123&state=456')
            ->assertRedirect('https://discord.com/channels/592327939920494592/592327939920494594');

        $this->assertNull($existingUser->discordUser);
        tap($newUser->discordUser, function (DiscordUser $discordUser) {
            $this->assertSame(696628666183975013, $discordUser->discord_api_id);
            $this->assertSame('Claudio Dekker#3220', $discordUser->discord_api_nickname);
            $this->assertSame('INVALIDxq3Ly5ca88vy9aUKjLIXdqr', $discordUser->discord_api_access_token);
            $this->assertSame('INVALIDb8yS0e3Iau0Pn6Q96yUHr9T', $discordUser->discord_api_refresh_token);
            Event::assertDispatched(DiscordConnectionUpdated::class, fn ($event) => $event->discordUser->is($discordUser));
        });
    }
}
